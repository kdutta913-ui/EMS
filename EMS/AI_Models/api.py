import os
from datetime import datetime, timedelta

from flask import Flask, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
import joblib
from sklearn.preprocessing import LabelEncoder
from pymongo import MongoClient

app = Flask(__name__)
CORS(app)

# ── MongoDB connection ────────────────────────────────────────────────────────
MONGO_URL = os.environ.get("MONGODB_URL", "mongodb://localhost:27017/EMS_DB")
_client = MongoClient(MONGO_URL)
db = _client.get_default_database()

# ── Load models ───────────────────────────────────────────────────────────────
attrition_model      = joblib.load("models/attrition_model.pkl")
leave_model          = joblib.load("models/leave_model.pkl")
performance_model    = joblib.load("models/performance_model.pkl")
payroll_model        = joblib.load("models/payroll_model.pkl")
fraud_model          = joblib.load("models/fraud_model.pkl")
recruitment_model    = joblib.load("models/recruitment_model.pkl")
company_growth_model = joblib.load("models/company_growth_model.pkl")

attrition_features   = joblib.load("models/attrition_features.pkl")
leave_features       = joblib.load("models/leave_features.pkl")
performance_features = joblib.load("models/performance_features.pkl")
payroll_features     = joblib.load("models/payroll_features.pkl")
fraud_features       = joblib.load("models/fraud_features.pkl")
recruitment_features = joblib.load("models/recruitment_features.pkl")
growth_features      = joblib.load("models/company_growth_features.pkl")


# ── Helpers ───────────────────────────────────────────────────────────────────

def _age(dob):
    if not dob:
        return 30
    today = datetime.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def _years_since(date):
    if not date:
        return 1.0
    delta = datetime.today() - date
    return max(round(delta.days / 365.25, 1), 0.1)


def _encode(df):
    for col in df.columns:
        if not pd.api.types.is_numeric_dtype(df[col]):
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col].astype(str))
    return df


def _safe_predict(model, df, features):
    if df.empty:
        return np.array([])
    return model.predict(df[features])


# ── MongoDB query helpers ─────────────────────────────────────────────────────

def _get_employees():
    return list(db.employees.find({}, {
        "_id": 1, "department": 1, "gender": 1, "role": 1, "designation": 1,
        "salary": 1, "dateOfJoining": 1, "dateOfBirth": 1,
        "address": 1, "location": 1,
    }))


def _perf_map():
    """Latest overallScore per employee → {eid_str: score}."""
    docs = sorted(
        db.performances.find({}, {"employeeId": 1, "overallScore": 1, "createdAt": 1}),
        key=lambda x: x.get("createdAt") or datetime.min,
    )
    result = {}
    for d in docs:
        score = d.get("overallScore")
        if score is not None:
            result[str(d["employeeId"])] = score
    return result


def _training_counts_last_year():
    """Count of completed trainings per employee in the last 12 months → {eid_str: count}."""
    cutoff = datetime.today() - timedelta(days=365)
    counts = {}
    for e in db.enrollments.find({"status": "completed", "completedAt": {"$gte": cutoff}}, {"employeeId": 1}):
        k = str(e["employeeId"])
        counts[k] = counts.get(k, 0) + 1
    return counts


def _training_hours_map():
    """Total training hours per employee from completed enrollments → {eid_str: hours}."""
    enrollments = list(db.enrollments.find({"status": "completed"}, {"employeeId": 1, "trainingId": 1}))
    if not enrollments:
        return {}
    tid_list = [e["trainingId"] for e in enrollments if e.get("trainingId")]
    dur_map  = {str(t["_id"]): t.get("duration", 8)
                for t in db.trainings.find({"_id": {"$in": tid_list}}, {"duration": 1})}
    hours = {}
    for e in enrollments:
        k = str(e.get("employeeId", ""))
        hours[k] = hours.get(k, 0) + dur_map.get(str(e.get("trainingId", "")), 8)
    return hours


def _task_count_map():
    """Task count per employee → {eid_str: count}."""
    counts = {}
    for t in db.tasks.find({}, {"assignedTo": 1}):
        k = str(t.get("assignedTo", ""))
        counts[k] = counts.get(k, 0) + 1
    return counts


def _dept_sizes(employees):
    """Employee count per department → {dept: count}."""
    sizes = {}
    for e in employees:
        d = e.get("department") or "Unknown"
        sizes[d] = sizes.get(d, 0) + 1
    return sizes


# ── DataFrame builders ────────────────────────────────────────────────────────

def _attrition_df():
    employees = _get_employees()
    if not employees:
        return pd.DataFrame(columns=attrition_features)
    perf   = _perf_map()
    trains = _training_counts_last_year()
    rows = []
    for emp in employees:
        eid   = str(emp["_id"])
        score = perf.get(eid)
        rows.append({
            "Age":                   _age(emp.get("dateOfBirth")),
            "Department":            emp.get("department") or "Unknown",
            "Gender":                emp.get("gender") or "Male",
            "JobRole":               emp.get("role") or emp.get("designation") or "Staff",
            "MonthlyIncome":         emp.get("salary") or 50000,
            "YearsAtCompany":        _years_since(emp.get("dateOfJoining")),
            "PerformanceRating":     round(score / 20, 1) if score is not None else 3.0,
            "TrainingTimesLastYear": trains.get(eid, 2),
        })
    return pd.DataFrame(rows)


def _leave_df():
    leaves = list(db.leaves.find({}, {"employeeId": 1, "type": 1, "totalDays": 1, "fromDate": 1}))
    if not leaves:
        return pd.DataFrame(columns=leave_features)

    emp_dept = {str(e["_id"]): e.get("department") or "Unknown"
                for e in db.employees.find({}, {"department": 1})}

    # Default entitlement by leave type
    entitlement = {
        "Earned Leave": 18, "Sick Leave": 12, "Casual Leave": 6,
        "Work From Home": 24, "Maternity Leave": 30,
        "Paternity Leave": 15, "Unpaid Leave": 0,
    }

    # Aggregate leave taken per employee
    taken_by_emp = {}
    for lv in leaves:
        k = str(lv.get("employeeId", ""))
        taken_by_emp[k] = taken_by_emp.get(k, 0) + (lv.get("totalDays") or 0)

    rows = []
    for lv in leaves:
        eid       = str(lv.get("employeeId", ""))
        ltype     = lv.get("type") or "Earned Leave"
        total_ent = entitlement.get(ltype, 12)
        taken     = lv.get("totalDays") or 0
        from_date = lv.get("fromDate") or datetime.today()
        rows.append({
            "Department":            emp_dept.get(eid, "Unknown"),
            "LeaveType":             ltype,
            "TotalLeaveEntitlement": total_ent,
            "LeaveTakenSoFar":       taken,
            "RemainingLeaves":       max(total_ent - taken, 0),
            "month":                 from_date.month if hasattr(from_date, "month") else datetime.today().month,
        })
    return pd.DataFrame(rows)


def _performance_df():
    employees = _get_employees()
    if not employees:
        return pd.DataFrame(columns=performance_features)
    tasks   = _task_count_map()
    tr_hrs  = _training_hours_map()
    sizes   = _dept_sizes(employees)
    rows = []
    for emp in employees:
        eid  = str(emp["_id"])
        dept = emp.get("department") or "Unknown"
        rows.append({
            "Department":          dept,
            "Gender":              emp.get("gender") or "Male",
            "Age":                 _age(emp.get("dateOfBirth")),
            "Years_At_Company":    _years_since(emp.get("dateOfJoining")),
            "Monthly_Salary":      emp.get("salary") or 50000,
            "Work_Hours_Per_Week": 40,
            "Projects_Handled":    tasks.get(eid, 5),
            "Training_Hours":      tr_hrs.get(eid, 20),
            "Team_Size":           sizes.get(dept, 5),
        })
    return pd.DataFrame(rows)


def _payroll_df():
    employees = _get_employees()
    if not employees:
        return pd.DataFrame(columns=payroll_features)
    perf   = _perf_map()
    tr_hrs = _training_hours_map()
    rows = []
    for emp in employees:
        eid   = str(emp["_id"])
        score = perf.get(eid)
        rows.append({
            "Department":              emp.get("department") or "Unknown",
            "Gender":                  emp.get("gender") or "Male",
            "Age":                     _age(emp.get("dateOfBirth")),
            "Job_Role":                emp.get("role") or emp.get("designation") or "Staff",
            "Years_At_Company":        _years_since(emp.get("dateOfJoining")),
            "Performance_Rating":      round(score / 20, 1) if score is not None else 3.0,
            "Training_Hours_Last_Year": tr_hrs.get(eid, 20),
        })
    return pd.DataFrame(rows)


def _fraud_df():
    """Uses employee behavioural signals to predict churn risk."""
    employees = _get_employees()
    if not employees:
        return pd.DataFrame(columns=fraud_features)
    perf  = _perf_map()
    tasks = _task_count_map()
    rows = []
    for emp in employees:
        eid   = str(emp["_id"])
        score = perf.get(eid)
        rows.append({
            "Department":           emp.get("department") or "Unknown",
            "Evaluation":           round(score / 100, 2) if score is not None else 0.60,
            "number_of_projects":   tasks.get(eid, 5),
            "average_montly_hours": 160,
            "time_spent_company":   _years_since(emp.get("dateOfJoining")),
            "Promotion":            0,
        })
    return pd.DataFrame(rows)


def _recruitment_df():
    employees = _get_employees()
    if not employees:
        return pd.DataFrame(columns=recruitment_features)
    salaries     = [e.get("salary") or 50000 for e in employees]
    low_thresh   = float(np.percentile(salaries, 33))
    high_thresh  = float(np.percentile(salaries, 66))

    def _tier(sal):
        s = sal or 50000
        return 1 if s < low_thresh else (2 if s < high_thresh else 3)

    rows = []
    for emp in employees:
        doj  = emp.get("dateOfJoining")
        city = (emp.get("address") or {}).get("city") or emp.get("location") or "Unknown"
        rows.append({
            "JoiningYear":               doj.year if doj else datetime.today().year,
            "Gender":                    emp.get("gender") or "Male",
            "Age":                       _age(emp.get("dateOfBirth")),
            "ExperienceInCurrentDomain": round(_years_since(doj)),
            "City":                      city,
            "PaymentTier":               _tier(emp.get("salary")),
        })
    return pd.DataFrame(rows)


def _growth_df():
    now        = datetime.today()
    year_start = datetime(now.year, 1, 1)
    total_emps = db.employees.count_documents({})
    new_workers = db.employees.count_documents({"dateOfJoining": {"$gte": year_start}})
    return pd.DataFrame([{"Year": now.year, "Employees": total_emps, "NewWorkers": new_workers}])


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/health")
def health():
    try:
        db.command("ping")
        return jsonify({"status": "ok", "db": "connected"})
    except Exception as e:
        return jsonify({"status": "ok", "db": "error", "detail": str(e)}), 200


@app.route("/analytics")
def analytics():
    _att = _safe_predict(attrition_model,      _encode(_attrition_df()),   attrition_features)
    _lea = _safe_predict(leave_model,           _encode(_leave_df()),       leave_features)
    _per = _safe_predict(performance_model,     _encode(_performance_df()), performance_features)
    _pay = _safe_predict(payroll_model,         _encode(_payroll_df()),     payroll_features)
    _fra = _safe_predict(fraud_model,           _encode(_fraud_df()),       fraud_features)
    _rec = _safe_predict(recruitment_model,     _encode(_recruitment_df()), recruitment_features)
    _gro = _safe_predict(company_growth_model,  _encode(_growth_df()),      growth_features)

    # Attrition
    att_total   = len(_att)
    att_leaving = int((_att == 1).sum()) if att_total else 0
    att_pct     = round(att_leaving / att_total * 100, 1) if att_total else 0

    # Leave
    lea_avg  = float(np.mean(_lea)) if len(_lea) else 0
    lea_high = int((_lea > lea_avg).sum()) if len(_lea) else 0

    # Performance — scale is 1–5 in training data
    per_avg = float(np.mean(_per)) if len(_per) else 0
    per_low = int((_per < 3.0).sum()) if len(_per) else 0
    per_top = int((_per >= 4.0).sum()) if len(_per) else 0

    # Payroll
    pay_avg  = float(np.mean(_pay)) if len(_pay) else 0
    pay_cost = float(np.sum(_pay))  if len(_pay) else 0

    # Fraud / churn
    fra_total = len(_fra)
    fra_count = int((_fra == 1).sum()) if fra_total else 0
    fra_pct   = round(fra_count / fra_total * 100, 1) if fra_total else 0
    fra_alert = "HIGH" if fra_pct > 20 else ("WARNING" if fra_pct > 5 else "LOW")

    # Recruitment
    rec_total = len(_rec)
    rec_risk  = int((_rec == 1).sum()) if rec_total else 0
    rec_pct   = round(rec_risk / rec_total * 100, 1) if rec_total else 0

    # Growth
    if len(_gro):
        gro_rev    = float(np.mean(_gro[:, 0])) if _gro.ndim == 2 else float(np.mean(_gro))
        gro_profit = float(np.mean(_gro[:, 1])) if _gro.ndim == 2 else 0.0
    else:
        gro_rev = gro_profit = 0.0

    return jsonify({
        "attrition": {
            "total": att_total, "leaving": att_leaving,
            "staying": att_total - att_leaving, "leaving_pct": att_pct,
        },
        "leave": {
            "total": len(_lea), "avg_days": round(lea_avg, 1), "high_count": lea_high,
        },
        "performance": {
            "total": len(_per), "avg_score": round(per_avg, 1),
            "low_performers": per_low, "top_performers": per_top,
        },
        "payroll": {
            "total": len(_pay), "avg_salary": round(pay_avg), "total_cost": round(pay_cost),
        },
        "fraud": {
            "total": fra_total, "flagged": fra_count,
            "fraud_pct": fra_pct, "alert_level": fra_alert,
        },
        "recruitment": {
            "total": rec_total, "flight_risk": rec_risk, "flight_risk_pct": rec_pct,
        },
        "growth": {
            "total": len(_gro), "avg_revenue": round(gro_rev), "avg_profit": round(gro_profit),
        },
    })


if __name__ == "__main__":
    app.run(port=8001, debug=False)

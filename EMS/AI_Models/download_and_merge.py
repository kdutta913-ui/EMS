"""
download_and_merge.py  (v2 - extended)
Idempotent: always rebuilds from original backups + all external sources.
Re-running produces the same clean result with no duplicate rows.

Data sources added:
  UCI Adult (id=2)                   -> Recruitment
  UCI Bank Marketing (id=222)        -> Recruitment
  UCI Absenteeism (id=445)           -> Leave
  Synthetic bootstrap                -> Leave
  Payroll  cross-merge               -> Attrition
  Performance (sampled) cross-merge  -> Attrition
  Attrition cross-merge              -> Payroll
  Performance (sampled) cross-merge  -> Payroll
  UCI Default Credit Card (id=350)   -> Fraud/Expense
  UCI Statlog German Credit (id=144) -> Fraud/Expense
  [Kaggle datasets if API key found]
"""

import os
import sys
import subprocess
import shutil
import pandas as pd
import numpy as np
from pathlib import Path

DATASETS_DIR = Path("datasets")
BACKUP_DIR   = Path("datasets/backups")

np.random.seed(42)


# ─────────────────────────────────────────────────────────
# Infrastructure
# ─────────────────────────────────────────────────────────

def ensure_package(package, install_name=None):
    try:
        __import__(package)
    except ImportError:
        name = install_name or package
        print(f"  Installing {name}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", name, "-q"])


def backup_once(filename):
    """Copy current file to backups/ only if backup does not exist yet."""
    BACKUP_DIR.mkdir(exist_ok=True)
    src = DATASETS_DIR / filename
    dst = BACKUP_DIR / filename
    if not dst.exists():
        shutil.copy2(src, dst)
        print(f"  Saved original backup -> {dst}")


def load_original(filename):
    """Load the original (pre-merge) data from backup if it exists."""
    backup_path = BACKUP_DIR / filename
    if backup_path.exists():
        return pd.read_csv(backup_path)
    return pd.read_csv(DATASETS_DIR / filename)


def save_and_report(df, filename, label):
    backup_once(filename)
    df.to_csv(DATASETS_DIR / filename, index=False)
    print(f"  {label}: {len(df):,} rows saved to {filename}")


# ─────────────────────────────────────────────────────────
# RECRUITMENT  extras
# ─────────────────────────────────────────────────────────

def extras_recruitment_adult(target_cols):
    """UCI Adult (id=2) -> education Bachelors/Masters/PHD rows."""
    ensure_package("ucimlrepo")
    from ucimlrepo import fetch_ucirepo
    ds    = fetch_ucirepo(id=2)
    adult = ds.data.features.copy()
    adult["income"] = ds.data.targets.values.ravel()

    edu_map = {"Bachelors": "Bachelors", "Masters": "Masters",
               "Doctorate": "PHD", "Prof-school": "PHD"}
    adult = adult[adult["education"].isin(edu_map)].copy()
    adult["Education"] = adult["education"].map(edu_map)
    adult["Age"]    = adult["age"].clip(18, 65)
    adult["Gender"] = adult["sex"].str.strip().map({"Male": "Male", "Female": "Female"})

    grad_age = {"Bachelors": 22, "Masters": 24, "PHD": 28}
    adult["ExperienceInCurrentDomain"] = adult.apply(
        lambda r: int(np.clip(r["age"] - grad_age[r["Education"]], 0, 7)), axis=1)

    adult["JoiningYear"] = 2018
    adult["City"]        = "Bangalore"
    adult["PaymentTier"] = adult["income"].str.strip().map({">50K": 3, "<=50K": 1})
    adult["EverBenched"] = "No"
    adult["LeaveOrNot"]  = 0
    return adult[target_cols].dropna()


def extras_recruitment_bank_marketing(target_cols):
    """UCI Bank Marketing (id=222) -> tertiary-educated rows."""
    ensure_package("ucimlrepo")
    from ucimlrepo import fetch_ucirepo
    ds = fetch_ucirepo(id=222)
    bm = ds.data.features.copy()

    # Keep only tertiary (university-level) education
    bm = bm[bm["education"] == "tertiary"].copy()
    n  = len(bm)

    # Assign education level probabilistically by age
    def edu_by_age(age):
        if age < 30:
            return np.random.choice(["Bachelors", "Masters"], p=[0.80, 0.20])
        if age < 42:
            return np.random.choice(["Bachelors", "Masters", "PHD"], p=[0.50, 0.40, 0.10])
        return np.random.choice(["Bachelors", "Masters", "PHD"], p=[0.35, 0.45, 0.20])

    bm["Education"] = bm["age"].apply(edu_by_age)
    bm["Age"]       = bm["age"].clip(18, 65)
    # Gender not in Bank Marketing; sample from realistic distribution
    bm["Gender"]    = np.random.choice(["Male", "Female"], n, p=[0.55, 0.45])

    job_exp = {"management": 7, "technician": 5, "entrepreneur": 6,
               "blue-collar": 3, "admin.": 4, "services": 3,
               "self-employed": 5, "retired": 7, "housemaid": 2,
               "unemployed": 0, "student": 0, "unknown": 3}
    bm["ExperienceInCurrentDomain"] = bm["job"].map(job_exp).fillna(3).clip(0, 7).astype(int)

    # Bank balance as PaymentTier proxy
    bm["PaymentTier"] = pd.cut(bm["balance"], bins=[-9999, 0, 5000, 999999],
                                labels=[1, 2, 3]).astype(float).fillna(2).astype(int)
    bm["JoiningYear"] = 2018
    bm["City"]        = "Bangalore"
    bm["EverBenched"] = "No"
    bm["LeaveOrNot"]  = 0
    return bm[target_cols].dropna()


# ─────────────────────────────────────────────────────────
# LEAVE  extras
# ─────────────────────────────────────────────────────────

def extras_leave_absenteeism(target_cols):
    """UCI Absenteeism at Work (id=445) -> leave rows."""
    ensure_package("ucimlrepo")
    from ucimlrepo import fetch_ucirepo
    ds = fetch_ucirepo(id=445)
    ab = ds.data.features.copy()
    ab["hours_absent"] = ds.data.targets.values.ravel()
    ab = ab[ab["hours_absent"] > 0].copy()

    col = {c.strip(): c for c in ab.columns}
    reason_col = col.get("Reason for absence")
    month_col  = col.get("Month of absence")

    month_map = {1:"Jan",2:"Feb",3:"Mar",4:"Apr",5:"May",6:"Jun",
                 7:"Jul",8:"Aug",9:"Sep",10:"Oct",11:"Nov",12:"Dec"}
    sick_codes = set(range(1, 21))

    def to_leave_type(code):
        if code == 15:            return "Maternity Leave"
        if code == 26:            return "Earned Leave"
        if code in sick_codes:    return "Sick Leave"
        return "Sick Leave"

    ab["Leave Type"]  = ab[reason_col].apply(to_leave_type) if reason_col else "Sick Leave"
    ab["Days Taken"]  = (ab["hours_absent"] / 8).apply(lambda x: max(1, round(x)))
    ab["month"]       = ab[month_col].map(month_map).fillna("Jan") if month_col else "Jan"
    ab["Employee Name"]           = "UCI_Employee"
    ab["Department"]              = "Unknown"
    ab["Position"]                = "Employee"
    ab["Start Date"]              = "01-01-2020"
    ab["End Date"]                = "01-01-2020"
    ab["Total Leave Entitlement"] = 21
    ab["Leave Taken So Far"]      = ab["Days Taken"]
    ab["Remaining Leaves"]        = (21 - ab["Days Taken"]).clip(lower=0)
    return ab[target_cols].dropna()


def extras_leave_synthetic(original_df, n_synthetic=600):
    """Bootstrap augmentation: resample from original 300 rows with controlled noise."""
    original_df = original_df.copy()
    numeric_cols = ["Days Taken", "Total Leave Entitlement", "Leave Taken So Far", "Remaining Leaves"]

    synth = original_df.sample(n=n_synthetic, replace=True, random_state=42).copy()
    synth["Employee Name"] = "Synthetic_Employee"
    synth["Start Date"]    = "01-01-2021"
    synth["End Date"]      = "01-01-2021"

    for col in numeric_cols:
        noise = np.random.normal(0, 1.2, n_synthetic)
        synth[col] = (synth[col].values + noise).round()

    synth["Days Taken"]          = synth["Days Taken"].clip(1, 30).astype(int)
    synth["Total Leave Entitlement"] = synth["Total Leave Entitlement"].clip(14, 30).astype(int)
    synth["Leave Taken So Far"]  = synth["Leave Taken So Far"].clip(0, 20).astype(int)
    synth["Remaining Leaves"]    = (
        synth["Total Leave Entitlement"] - synth["Leave Taken So Far"]
    ).clip(lower=0).astype(int)
    return synth[original_df.columns]


# ─────────────────────────────────────────────────────────
# ATTRITION  extras
# ─────────────────────────────────────────────────────────

def extras_attrition_from_payroll(attrition_cols):
    """payroll_data.csv -> attrition rows (original payroll, from backup if exists)."""
    payroll = load_original("payroll_data.csv")
    edu_map = {"High School": 1, "Associate's Degree": 2,
               "Bachelor's Degree": 3, "Master's Degree": 4, "PhD": 5}

    def job_level(role):
        r = str(role).lower()
        if "intern"   in r: return 1
        if "director" in r: return 4
        if "manager"  in r: return 3
        if "senior"   in r: return 3
        return 2

    n = len(payroll)
    extra = pd.DataFrame({
        "Age":                      payroll["Age"],
        "Attrition":                payroll["Attrition"],
        "BusinessTravel":           "Travel_Rarely",
        "DailyRate":                (payroll["Monthly_Income"] / 22).round().astype(int),
        "Department":               payroll["Department"],
        "DistanceFromHome":         payroll["Distance_From_Home"],
        "Education":                payroll["Education_Level"].map(edu_map).fillna(3).astype(int),
        "EducationField":           "Other",
        "EmployeeCount":            1,
        "EmployeeNumber":           range(9000, 9000 + n),
        "EnvironmentSatisfaction":  3,
        "Gender":                   payroll["Gender"],
        "HourlyRate":               (payroll["Monthly_Income"] / 176).round().astype(int),
        "JobInvolvement":           3,
        "JobLevel":                 payroll["Job_Role"].apply(job_level),
        "JobRole":                  payroll["Job_Role"],
        "JobSatisfaction":          payroll["Job_Satisfaction"],
        "MaritalStatus":            payroll["Marital_Status"],
        "MonthlyIncome":            payroll["Monthly_Income"],
        "MonthlyRate":              (payroll["Monthly_Income"] * 1.2).round().astype(int),
        "NumCompaniesWorked":       payroll["Number_Of_Companies_Worked"],
        "Over18":                   "Y",
        "OverTime":                 payroll["Overtime"],
        "PercentSalaryHike":        15,
        "PerformanceRating":        payroll["Performance_Rating"],
        "RelationshipSatisfaction": 3,
        "StandardHours":            80,
        "StockOptionLevel":         payroll["Stock_Option_Level"],
        "TotalWorkingYears":        payroll["Years_At_Company"] + payroll["Number_Of_Companies_Worked"].fillna(0) * 2,
        "TrainingTimesLastYear":    (payroll["Training_Hours_Last_Year"] / 10).round().clip(0, 6).astype(int),
        "WorkLifeBalance":          payroll["Work_Life_Balance"],
        "YearsAtCompany":           payroll["Years_At_Company"],
        "YearsInCurrentRole":       payroll["Years_In_Current_Role"],
        "YearsSinceLastPromotion":  payroll["Last_Promotion_Years_Ago"],
        "YearsWithCurrManager":     payroll["Years_In_Current_Role"],
    })
    return extra[attrition_cols].dropna()


def extras_attrition_from_performance(attrition_cols, sample_n=6000):
    """employee_performance.csv (sample) -> attrition rows."""
    perf = pd.read_csv(DATASETS_DIR / "employee_performance.csv").sample(
        n=min(sample_n, 100000), random_state=42)

    edu_map = {"High School": 1, "Bachelor": 2, "Master": 3, "PhD": 5,
               "Associate": 2}

    def edu_num(edu_level):
        for key, val in edu_map.items():
            if key.lower() in str(edu_level).lower():
                return val
        return 3

    def job_level(role):
        r = str(role).lower()
        if "intern"    in r: return 1
        if "director"  in r: return 4
        if "manager"   in r: return 3
        if "senior"    in r: return 3
        if "analyst"   in r: return 2
        return 2

    n = len(perf)
    extra = pd.DataFrame({
        "Age":                      perf["Age"],
        "Attrition":                perf["Resigned"].map({True: "Yes", False: "No",
                                        "True": "Yes", "False": "No"}).fillna("No"),
        "BusinessTravel":           "Travel_Rarely",
        "DailyRate":                (perf["Monthly_Salary"] / 22).round().astype(int),
        "Department":               perf["Department"],
        "DistanceFromHome":         np.random.randint(1, 30, n),
        "Education":                perf["Education_Level"].apply(edu_num),
        "EducationField":           "Other",
        "EmployeeCount":            1,
        "EmployeeNumber":           range(20000, 20000 + n),
        "EnvironmentSatisfaction":  3,
        "Gender":                   perf["Gender"],
        "HourlyRate":               (perf["Monthly_Salary"] / 176).round().astype(int),
        "JobInvolvement":           3,
        "JobLevel":                 perf["Job_Title"].apply(job_level),
        "JobRole":                  perf["Job_Title"],
        "JobSatisfaction":          (perf["Employee_Satisfaction_Score"] * 4 / 5).round().clip(1, 4).astype(int),
        "MaritalStatus":            np.random.choice(["Single", "Married", "Divorced"], n),
        "MonthlyIncome":            perf["Monthly_Salary"],
        "MonthlyRate":              (perf["Monthly_Salary"] * 1.2).round().astype(int),
        "NumCompaniesWorked":       np.random.randint(0, 6, n),
        "Over18":                   "Y",
        "OverTime":                 perf["Overtime_Hours"].apply(lambda x: "Yes" if x > 0 else "No"),
        "PercentSalaryHike":        15,
        "PerformanceRating":        (perf["Performance_Score"] / 2.5).round().clip(1, 4).astype(int),
        "RelationshipSatisfaction": 3,
        "StandardHours":            80,
        "StockOptionLevel":         np.random.randint(0, 4, n),
        "TotalWorkingYears":        perf["Years_At_Company"] + np.random.randint(0, 4, n),
        "TrainingTimesLastYear":    (perf["Training_Hours"] / 10).round().clip(0, 6).astype(int),
        "WorkLifeBalance":          perf["Overtime_Hours"].apply(
                                        lambda h: 1 if h > 40 else 2 if h > 20 else 3),
        "YearsAtCompany":           perf["Years_At_Company"],
        "YearsInCurrentRole":       (perf["Years_At_Company"] / 2).round().astype(int),
        "YearsSinceLastPromotion":  perf["Promotions"].apply(lambda p: 0 if p > 0 else 3),
        "YearsWithCurrManager":     np.random.randint(0, 6, n),
    })
    return extra[attrition_cols].dropna()


# ─────────────────────────────────────────────────────────
# PAYROLL  extras
# ─────────────────────────────────────────────────────────

def extras_payroll_from_attrition(payroll_cols):
    """employee_attrition.csv (original) -> payroll rows."""
    attrition = load_original("employee_attrition.csv")
    edu_num_map = {1: "High School", 2: "Associate's Degree",
                   3: "Bachelor's Degree", 4: "Master's Degree", 5: "PhD"}
    n = len(attrition)
    extra = pd.DataFrame({
        "Employee_ID":               range(9000, 9000 + n),
        "Department":                attrition["Department"],
        "Gender":                    attrition["Gender"],
        "Age":                       attrition["Age"],
        "Education_Level":           attrition["Education"].map(edu_num_map).fillna("Bachelor's Degree"),
        "Job_Role":                  attrition["JobRole"],
        "Monthly_Income":            attrition["MonthlyIncome"],
        "Years_At_Company":          attrition["YearsAtCompany"],
        "Years_In_Current_Role":     attrition["YearsInCurrentRole"],
        "Job_Satisfaction":          attrition["JobSatisfaction"],
        "Performance_Rating":        attrition["PerformanceRating"],
        "Work_Life_Balance":         attrition["WorkLifeBalance"],
        "Training_Hours_Last_Year":  attrition["TrainingTimesLastYear"] * 10,
        "Last_Promotion_Years_Ago":  attrition["YearsSinceLastPromotion"],
        "Distance_From_Home":        attrition["DistanceFromHome"],
        "Overtime":                  attrition["OverTime"],
        "Attrition":                 attrition["Attrition"],
        "Marital_Status":            attrition["MaritalStatus"],
        "Number_Of_Companies_Worked": attrition["NumCompaniesWorked"],
        "Stock_Option_Level":        attrition["StockOptionLevel"],
    })
    return extra[payroll_cols].dropna()


def extras_payroll_from_performance(payroll_cols, sample_n=6000):
    """employee_performance.csv (sample) -> payroll rows."""
    perf = pd.read_csv(DATASETS_DIR / "employee_performance.csv").sample(
        n=min(sample_n, 100000), random_state=123)

    edu_map_text = {"High School": "High School", "Bachelor": "Bachelor's Degree",
                    "Master": "Master's Degree", "PhD": "PhD", "Associate": "Associate's Degree"}

    def map_edu(level):
        for key, val in edu_map_text.items():
            if key.lower() in str(level).lower():
                return val
        return "Bachelor's Degree"

    n = len(perf)
    extra = pd.DataFrame({
        "Employee_ID":               range(18000, 18000 + n),
        "Department":                perf["Department"],
        "Gender":                    perf["Gender"],
        "Age":                       perf["Age"],
        "Education_Level":           perf["Education_Level"].apply(map_edu),
        "Job_Role":                  perf["Job_Title"],
        "Monthly_Income":            perf["Monthly_Salary"],
        "Years_At_Company":          perf["Years_At_Company"],
        "Years_In_Current_Role":     (perf["Years_At_Company"] / 2).round().astype(int),
        "Job_Satisfaction":          (perf["Employee_Satisfaction_Score"] * 4 / 5).round().clip(1, 5).astype(int),
        "Performance_Rating":        (perf["Performance_Score"] / 2).round().clip(1, 5).astype(int),
        "Work_Life_Balance":         perf["Overtime_Hours"].apply(
                                         lambda h: 1 if h > 40 else 2 if h > 20 else 3),
        "Training_Hours_Last_Year":  perf["Training_Hours"],
        "Last_Promotion_Years_Ago":  perf["Promotions"].apply(lambda p: 0 if p > 0 else 3),
        "Distance_From_Home":        np.random.randint(1, 30, n),
        "Overtime":                  perf["Overtime_Hours"].apply(lambda x: "Yes" if x > 0 else "No"),
        "Attrition":                 perf["Resigned"].map({True: "Yes", False: "No",
                                         "True": "Yes", "False": "No"}).fillna("No"),
        "Marital_Status":            np.random.choice(["Single", "Married", "Divorced"], n),
        "Number_Of_Companies_Worked": np.random.randint(0, 6, n),
        "Stock_Option_Level":        np.random.randint(0, 4, n),
    })
    return extra[payroll_cols].dropna()


# ─────────────────────────────────────────────────────────
# FRAUD / EXPENSE  extras
# ─────────────────────────────────────────────────────────

def extras_fraud_credit_default(expense_cols):
    """UCI Default of Credit Card Clients (id=350) -> Churn rows.
    Columns are X1..X23 (X1=LIMIT_BAL, X6=PAY_0 repayment status), target=Y."""
    ensure_package("ucimlrepo")
    from ucimlrepo import fetch_ucirepo
    ds = fetch_ucirepo(id=350)
    cc = ds.data.features.copy()
    cc["Churn"] = ds.data.targets["Y"].values

    # X1=LIMIT_BAL, X5=AGE, X6=PAY_0 (payment delay: -1=paid,0=revolving,1+=late)
    dept_choices = ["sales", "IT", "Finance", "HR", "Operations", "Marketing"]
    n = len(cc)

    # PAY_0 (X6): higher = more delayed = worse satisfaction
    pay0 = cc["X6"].clip(-1, 4)
    extra = pd.DataFrame()
    extra["EmpId"]                = range(50000, 50000 + n)
    extra["Satisfaction"]         = (5 - pay0).clip(1, 10).round(1)
    extra["Evaluation"]           = np.random.uniform(3, 10, n).round(1)
    extra["number_of_projects"]   = np.random.randint(2, 7, n)
    extra["average_montly_hours"] = np.random.randint(150, 310, n)
    extra["time_spent_company"]   = np.random.randint(1, 10, n)
    extra["work_accident"]        = 0
    extra["Promotion"]            = np.random.randint(0, 2, n)
    extra["Department"]           = np.random.choice(dept_choices, n)
    # X1=LIMIT_BAL: credit limit as income proxy (monthly ~1/12 of annual limit)
    extra["Salary_INR"]           = (cc["X1"].values / 12).round()
    extra["Churn"]                = cc["Churn"].values
    return extra[expense_cols].dropna()


def extras_fraud_german_credit(expense_cols):
    """UCI Statlog German Credit (id=144) -> Churn rows.
    Columns are Attribute1..20, target=class (1=good, 2=bad)."""
    ensure_package("ucimlrepo")
    from ucimlrepo import fetch_ucirepo
    ds = fetch_ucirepo(id=144)
    gc = ds.data.features.copy()
    gc["class"] = ds.data.targets["class"].values

    dept_choices = ["sales", "IT", "Finance", "HR", "Operations"]
    n = len(gc)
    is_bad = (gc["class"] == 2).values

    extra = pd.DataFrame()
    extra["EmpId"]                = range(60000, 60000 + n)
    extra["Satisfaction"]         = np.where(is_bad,
                                        np.random.uniform(1, 5, n),
                                        np.random.uniform(5, 10, n)).round(1)
    extra["Evaluation"]           = np.random.uniform(2, 10, n).round(1)
    extra["number_of_projects"]   = np.random.randint(2, 6, n)
    extra["average_montly_hours"] = np.random.randint(150, 300, n)
    extra["time_spent_company"]   = np.random.randint(1, 8, n)
    extra["work_accident"]        = 0
    extra["Promotion"]            = np.random.randint(0, 2, n)
    extra["Department"]           = np.random.choice(dept_choices, n)
    extra["Salary_INR"]           = np.random.randint(10000, 60000, n)
    extra["Churn"]                = is_bad.astype(int)
    return extra[expense_cols].dropna()


# ─────────────────────────────────────────────────────────
# KAGGLE  (only if kaggle.json exists)
# ─────────────────────────────────────────────────────────

def handle_kaggle(recruitment_extras, payroll_extras, fraud_extras):
    kaggle_json = Path.home() / ".kaggle" / "kaggle.json"
    if not kaggle_json.exists():
        print("\n  [Kaggle] kaggle.json not found -- skipped.")
        print("  Steps to enable:")
        print("  1. kaggle.com -> Account -> API -> Create New Token")
        print(f"  2. Save kaggle.json to {Path.home() / '.kaggle'}")
        print("  3. Re-run this script for +300k more rows.")
        print()
        print("  Pending datasets:")
        print("  arashnic/hr-analytics-job-change-... -> Recruitment (+19k)")
        print("  mlg-ulb/creditcardfraud             -> Fraud      (+284k)")
        print("  ealaxi/paysim1                      -> Fraud      (+6M)")
        print("  ruchi798/data-science-job-salaries  -> Payroll    (+600)")
        return

    ensure_package("kaggle")
    print("\n  [Kaggle] API key found -- downloading...")
    _dl("arashnic/hr-analytics-job-change-of-data-scientists",
        "recruitment_kaggle", recruitment_extras)
    _dl("mlg-ulb/creditcardfraud", "fraud_cc", fraud_extras)
    _dl("ealaxi/paysim1",          "fraud_paysim", fraud_extras)
    _dl("ruchi798/data-science-job-salaries", "salaries", payroll_extras)


def _dl(slug, tag, extra_list):
    dest = DATASETS_DIR / "kaggle_downloads" / tag
    dest.mkdir(parents=True, exist_ok=True)
    r = subprocess.run(
        ["kaggle", "datasets", "download", "-d", slug, "-p", str(dest), "--unzip"],
        capture_output=True, text=True)
    if r.returncode != 0:
        print(f"  Failed {slug}: {r.stderr.strip()[:100]}")
        return
    csvs = list(dest.glob("*.csv"))
    if not csvs:
        return
    print(f"  Downloaded {slug}")
    extra_list.append(("kaggle:" + tag, pd.read_csv(csvs[0])))


# ─────────────────────────────────────────────────────────
# BUILDERS  (one per output file)
# ─────────────────────────────────────────────────────────

def build_recruitment():
    print("\n=== RECRUITMENT ===")
    original = load_original("recruitment_data.csv")
    cols     = original.columns.tolist()
    parts    = [original]

    print("  [+] UCI Adult dataset...")
    parts.append(extras_recruitment_adult(cols))

    print("  [+] UCI Bank Marketing...")
    parts.append(extras_recruitment_bank_marketing(cols))

    merged = pd.concat(parts, ignore_index=True)
    save_and_report(merged, "recruitment_data.csv", "Recruitment")


def build_leave():
    print("\n=== LEAVE ===")
    original = load_original("employee_leave.csv")
    cols     = original.columns.tolist()
    parts    = [original]

    print("  [+] UCI Absenteeism at Work...")
    parts.append(extras_leave_absenteeism(cols))

    print("  [+] Synthetic bootstrap augmentation...")
    parts.append(extras_leave_synthetic(original, n_synthetic=800))

    merged = pd.concat(parts, ignore_index=True)
    save_and_report(merged, "employee_leave.csv", "Leave")


def build_attrition():
    print("\n=== ATTRITION ===")
    original = load_original("employee_attrition.csv")
    cols     = original.columns.tolist()
    parts    = [original]

    print("  [+] Payroll data cross-merge...")
    parts.append(extras_attrition_from_payroll(cols))

    print("  [+] Performance data cross-merge (sample 6k)...")
    parts.append(extras_attrition_from_performance(cols, sample_n=6000))

    merged = pd.concat(parts, ignore_index=True)
    save_and_report(merged, "employee_attrition.csv", "Attrition")


def build_payroll():
    print("\n=== PAYROLL ===")
    original = load_original("payroll_data.csv")
    cols     = original.columns.tolist()
    parts    = [original]

    print("  [+] Attrition data cross-merge...")
    parts.append(extras_payroll_from_attrition(cols))

    print("  [+] Performance data cross-merge (sample 6k)...")
    parts.append(extras_payroll_from_performance(cols, sample_n=6000))

    merged = pd.concat(parts, ignore_index=True)
    save_and_report(merged, "payroll_data.csv", "Payroll")


def build_fraud():
    print("\n=== FRAUD / EXPENSE ===")
    original = pd.read_csv(DATASETS_DIR / "expense_data.csv")
    cols     = original.columns.tolist()
    parts    = [original]

    print("  [+] UCI Default Credit Card Clients...")
    parts.append(extras_fraud_credit_default(cols))

    print("  [+] UCI Statlog German Credit...")
    parts.append(extras_fraud_german_credit(cols))

    merged = pd.concat(parts, ignore_index=True)
    backup_once("expense_data.csv")
    save_and_report(merged, "expense_data.csv", "Fraud/Expense")


# ─────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 62)
    print("  Download & Merge Pipeline  (v2 - idempotent)")
    print("=" * 62)

    build_recruitment()
    build_leave()
    build_attrition()
    build_payroll()
    build_fraud()
    handle_kaggle([], [], [])   # Kaggle placeholders; extends above if key found

    print("\n" + "=" * 62)
    print("  Final row counts:")
    print("=" * 62)
    for f in ["recruitment_data.csv", "employee_attrition.csv",
              "employee_performance.csv", "employee_leave.csv",
              "payroll_data.csv", "expense_data.csv", "company_growth.csv"]:
        try:
            n = sum(1 for _ in open(DATASETS_DIR / f)) - 1
            print(f"  {f:<32} {n:>8,} rows")
        except Exception:
            pass

    print()
    print("  Originals are safe in datasets/backups/")
    print("  Now re-run all train_*.py to benefit from expanded data.")
    print("=" * 62)

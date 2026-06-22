import pandas as pd
import joblib

from sklearn.preprocessing import LabelEncoder


# =========================
# LOAD MODELS
# =========================

attrition_model      = joblib.load("models/attrition_model.pkl")
leave_model          = joblib.load("models/leave_model.pkl")
performance_model    = joblib.load("models/performance_model.pkl")
payroll_model        = joblib.load("models/payroll_model.pkl")
fraud_model          = joblib.load("models/fraud_model.pkl")
recruitment_model    = joblib.load("models/recruitment_model.pkl")
company_growth_model = joblib.load("models/company_growth_model.pkl")


# =========================
# LOAD FEATURE LISTS
# =========================

attrition_features   = joblib.load("models/attrition_features.pkl")
leave_features       = joblib.load("models/leave_features.pkl")
performance_features = joblib.load("models/performance_features.pkl")
payroll_features     = joblib.load("models/payroll_features.pkl")
fraud_features       = joblib.load("models/fraud_features.pkl")
recruitment_features = joblib.load("models/recruitment_features.pkl")
growth_features      = joblib.load("models/company_growth_features.pkl")


# =========================
# LOAD DATASETS
# =========================

attrition_data   = pd.read_csv("datasets/employee_attrition.csv")
leave_data       = pd.read_csv("datasets/employee_leave.csv")
performance_data = pd.read_csv("datasets/employee_performance.csv")
payroll_data     = pd.read_csv("datasets/payroll_data.csv")
fraud_data       = pd.read_csv("datasets/expense_data.csv")
recruitment_data = pd.read_csv("datasets/recruitment_data.csv")
growth_data      = pd.read_csv("datasets/company_growth.csv")


# =========================
# PRE-PROCESSING TWEAKS
# =========================

# Rename spaced leave columns to match trained feature names
leave_data = leave_data.rename(columns={
    "Leave Type":              "LeaveType",
    "Total Leave Entitlement": "TotalLeaveEntitlement",
    "Leave Taken So Far":      "LeaveTakenSoFar",
    "Remaining Leaves":        "RemainingLeaves",
})


# =========================
# ENCODE NON-NUMERIC DATA
# =========================

datasets = [
    attrition_data,
    leave_data,
    performance_data,
    payroll_data,
    fraud_data,
    recruitment_data,
    growth_data,
]

for df in datasets:

    for column in df.columns:

        if not pd.api.types.is_numeric_dtype(df[column]):

            le = LabelEncoder()

            df[column] = le.fit_transform(
                df[column].astype(str)
            )


# =========================
# PREPARE INPUTS  (select only the columns each model was trained on)
# =========================

attrition_input   = attrition_data[attrition_features]
leave_input       = leave_data[leave_features]
performance_input = performance_data[performance_features]
payroll_input     = payroll_data[payroll_features]
fraud_input       = fraud_data[fraud_features]
recruitment_input = recruitment_data[recruitment_features]
growth_input      = growth_data[growth_features]


# =========================
# PREDICTIONS
# =========================

attrition_predictions = attrition_model.predict(
    attrition_input
)

leave_predictions = leave_model.predict(
    leave_input
)

performance_predictions = performance_model.predict(
    performance_input
)

payroll_predictions = payroll_model.predict(
    payroll_input
)

fraud_predictions = fraud_model.predict(
    fraud_input
)

recruitment_predictions = recruitment_model.predict(
    recruitment_input
)

growth_predictions = company_growth_model.predict(
    growth_input
)


# =========================
# CENTRAL AI ANALYTICS
# =========================

print("\n===== CENTRAL AI ANALYTICS ENGINE =====\n")


attrition_labels = ["Leaving" if p == 1 else "Staying" for p in attrition_predictions]

print("Attrition Predictions:")
print(attrition_labels[:5])


print("\nLeave Predictions:")
print(leave_predictions[:5])


print("\nPerformance Predictions:")
print(performance_predictions[:5])


print("\nPayroll Predictions:")
print(payroll_predictions[:5])


fraud_labels = ["Fraud Detected" if p == 1 else "Not Fraud" for p in fraud_predictions]

print("\nFraud Predictions:")
print(fraud_labels[:5])


recruitment_labels = ["Leaving" if p == 1 else "Staying" for p in recruitment_predictions]

print("\nRecruitment (Flight Risk) Predictions:")
print(recruitment_labels[:5])


print("\nCompany Growth Predictions:")
print(growth_predictions[:5])


# =========================
# AI INSIGHTS
# =========================

print("\n===== AI INSIGHTS =====\n")


avg_performance = performance_predictions.mean()

avg_leave = leave_predictions.mean()


if avg_performance < 60:

    print("Employee performance needs improvement.")

else:

    print("Employee performance is stable.")


if avg_leave > 10:

    print("High employee leave trend detected.")

else:

    print("Leave rate is under control.")


fraud_count = sum(1 for p in fraud_predictions if p == 1)
fraud_rate = (fraud_count / len(fraud_predictions)) * 100

if fraud_rate > 20:

    print(f"HIGH ALERT: {fraud_count} fraud cases detected ({fraud_rate:.1f}% of records).")

elif fraud_rate > 5:

    print(f"WARNING: {fraud_count} suspicious cases flagged ({fraud_rate:.1f}% of records).")

else:

    print(f"Fraud risk is low: {fraud_count} cases flagged ({fraud_rate:.1f}% of records).")


print("\n===== ENGINE COMPLETED =====")

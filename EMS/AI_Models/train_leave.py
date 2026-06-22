import pandas as pd
import joblib

from sklearn.model_selection import train_test_split, KFold, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer, LabelEncoder
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, r2_score

from preprocessing import preprocess_leave as preprocess


# =========================
# LOAD DATASET
# =========================

df = pd.read_csv("datasets/employee_leave.csv")


# =========================
# RENAME SPACED COLUMN NAMES
# =========================

df = df.rename(columns={
    "Leave Type":              "LeaveType",
    "Total Leave Entitlement": "TotalLeaveEntitlement",
    "Leave Taken So Far":      "LeaveTakenSoFar",
    "Remaining Leaves":        "RemainingLeaves",
})


# =========================
# SELECT EMS-COMPATIBLE FEATURES
# =========================

FEATURES = [
    "Department", "LeaveType", "TotalLeaveEntitlement",
    "LeaveTakenSoFar", "RemainingLeaves", "month",
]

df = df[FEATURES + ["Days Taken"]]


# =========================
# ENCODE NON-NUMERIC COLUMNS
# =========================

for col in df.columns:

    if not pd.api.types.is_numeric_dtype(df[col]):

        le = LabelEncoder()

        df[col] = le.fit_transform(df[col].astype(str))


# =========================
# FEATURES & TARGET
# =========================

X = df[FEATURES]

y = df["Days Taken"]


# =========================
# PIPELINE
# =========================

# GradientBoosting works better than RandomForest on small datasets (300 rows)
pipeline = Pipeline([
    ("engineer", FunctionTransformer(preprocess, validate=False)),
    ("model", GradientBoostingRegressor(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        min_samples_leaf=3,
        random_state=42
    ))
])


# =========================
# TRAIN TEST SPLIT
# =========================

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42
)


# =========================
# CROSS-VALIDATION
# =========================

cv = KFold(n_splits=5, shuffle=True, random_state=42)

cv_scores = cross_val_score(pipeline, X_train, y_train, cv=cv, scoring="r2")

print(f"Cross-Validation R²: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")


# =========================
# TRAIN ON FULL TRAIN SET
# =========================

pipeline.fit(X_train, y_train)


# =========================
# EVALUATE
# =========================

predictions = pipeline.predict(X_test)

print(f"Test R²  : {r2_score(y_test, predictions):.4f}")
print(f"Test MAE : {mean_absolute_error(y_test, predictions):.4f}")


# =========================
# SAVE MODEL + FEATURE LIST
# =========================

joblib.dump(pipeline, "models/leave_model.pkl")
joblib.dump(FEATURES, "models/leave_features.pkl")

print("Leave Model Trained Successfully")

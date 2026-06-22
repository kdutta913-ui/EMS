import pandas as pd
import joblib

from sklearn.model_selection import train_test_split, KFold, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer, LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score

from xgboost import XGBRegressor

from preprocessing import preprocess_performance as preprocess


# =========================
# LOAD DATASET
# =========================

df = pd.read_csv("datasets/employee_performance.csv")


# =========================
# SELECT EMS-COMPATIBLE FEATURES
# =========================

FEATURES = [
    "Department", "Gender", "Age", "Years_At_Company", "Monthly_Salary",
    "Work_Hours_Per_Week", "Projects_Handled", "Training_Hours", "Team_Size",
]

df = df[FEATURES + ["Performance_Score"]]


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

y = df["Performance_Score"]


# =========================
# PIPELINE
# =========================

# XGBRegressor is significantly faster and more accurate than RandomForest on 100k rows
pipeline = Pipeline([
    ("engineer", FunctionTransformer(preprocess, validate=False)),
    ("model", XGBRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=5,
        gamma=0.1,
        eval_metric="rmse",
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

joblib.dump(pipeline, "models/performance_model.pkl")
joblib.dump(FEATURES, "models/performance_features.pkl")

print("Performance Model Trained Successfully")

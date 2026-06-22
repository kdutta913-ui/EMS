import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split, KFold, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score

from preprocessing import preprocess_growth as preprocess


# =========================
# LOAD DATASET
# =========================

df = pd.read_csv("datasets/company_growth.csv")


# =========================
# SELECT FEATURES & TARGETS
# =========================

FEATURES = ["Year", "Employees", "NewWorkers"]
TARGETS   = ["Revenue", "Profit"]

df = df[FEATURES + TARGETS]


# =========================
# FEATURES & TARGET
# =========================

X = df[FEATURES]

y = df[TARGETS]


# =========================
# PIPELINE
# =========================

# RandomForestRegressor supports multi-output natively (no wrapper needed)
pipeline = Pipeline([
    ("engineer", FunctionTransformer(preprocess, validate=False)),
    ("model", RandomForestRegressor(
        n_estimators=300,
        max_depth=20,
        min_samples_leaf=2,
        max_features=0.7,
        n_jobs=-1,
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

joblib.dump(pipeline, "models/company_growth_model.pkl")
joblib.dump(FEATURES, "models/company_growth_features.pkl")

print("Company Growth Model Saved Successfully")

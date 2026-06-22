import pandas as pd
import joblib

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer, LabelEncoder
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score

from xgboost import XGBClassifier

from preprocessing import preprocess_fraud as preprocess


# =========================
# LOAD DATASET
# =========================

df = pd.read_csv("datasets/expense_data.csv")


# =========================
# SELECT EMS-COMPATIBLE FEATURES
# =========================

FEATURES = [
    "Department", "Evaluation", "number_of_projects",
    "average_montly_hours", "time_spent_company", "Promotion",
]

df = df[FEATURES + ["Churn"]]


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

y = df["Churn"]


# =========================
# CLASS IMBALANCE WEIGHT
# =========================

neg, pos = (y == 0).sum(), (y == 1).sum()

scale_weight = neg / pos


# =========================
# TRAIN TEST SPLIT
# =========================

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)


# =========================
# PIPELINE
# =========================

pipeline = Pipeline([
    ("engineer", FunctionTransformer(preprocess, validate=False)),
    ("model", XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=5,
        gamma=0.1,
        scale_pos_weight=scale_weight,
        eval_metric="auc",
        random_state=42
    ))
])


# =========================
# CROSS-VALIDATION
# =========================

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

cv_scores = cross_val_score(pipeline, X_train, y_train, cv=cv, scoring="roc_auc")

print(f"Cross-Validation AUC: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")


# =========================
# TRAIN ON FULL TRAIN SET
# =========================

pipeline.fit(X_train, y_train)


# =========================
# EVALUATE ON TEST SET
# =========================

predictions = pipeline.predict(X_test)

proba = pipeline.predict_proba(X_test)[:, 1]

accuracy = accuracy_score(y_test, predictions)

auc = roc_auc_score(y_test, proba)

print(f"\nTest Accuracy : {accuracy * 100:.2f}%")
print(f"Test AUC-ROC  : {auc:.4f}")
print("\nClassification Report:")
print(classification_report(y_test, predictions, target_names=["Not Churned", "Churned"]))


# =========================
# SAVE MODEL + FEATURE LIST
# =========================

joblib.dump(pipeline, "models/fraud_model.pkl")
joblib.dump(FEATURES, "models/fraud_features.pkl")

print("\nFraud Detection Model Trained Successfully")

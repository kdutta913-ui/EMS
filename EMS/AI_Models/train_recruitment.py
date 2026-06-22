import pandas as pd
import joblib

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer, LabelEncoder
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score

from xgboost import XGBClassifier

from preprocessing import preprocess_recruitment as preprocess


# =========================
# LOAD DATASET
# =========================

df = pd.read_csv("datasets/recruitment_data.csv")


# =========================
# SELECT EMS-COMPATIBLE FEATURES  (target switched to LeaveOrNot)
# =========================

FEATURES = [
    "JoiningYear", "Gender", "Age", "ExperienceInCurrentDomain",
    "City", "PaymentTier",
]

df = df[FEATURES + ["LeaveOrNot"]]


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

y = df["LeaveOrNot"]


# =========================
# CLASS IMBALANCE WEIGHT
# =========================

neg, pos = (y == 0).sum(), (y == 1).sum()

scale_weight = neg / pos


# =========================
# PIPELINE
# =========================

# Binary flight-risk classifier; replaces the original Education multi-class model
pipeline = Pipeline([
    ("engineer", FunctionTransformer(preprocess, validate=False)),
    ("model", XGBClassifier(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=3,
        scale_pos_weight=scale_weight,
        eval_metric="auc",
        random_state=42
    ))
])


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
# EVALUATE
# =========================

predictions = pipeline.predict(X_test)

proba = pipeline.predict_proba(X_test)[:, 1]

print(f"Test Accuracy : {accuracy_score(y_test, predictions) * 100:.2f}%")
print(f"Test AUC-ROC  : {roc_auc_score(y_test, proba):.4f}")
print(classification_report(y_test, predictions, target_names=["Staying", "Leaving"]))


# =========================
# SAVE MODEL + FEATURE LIST
# =========================

joblib.dump(pipeline, "models/recruitment_model.pkl")
joblib.dump(FEATURES, "models/recruitment_features.pkl")

print("Recruitment Model Trained Successfully")

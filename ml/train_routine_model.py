import pandas as pd
import os
import pickle

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

# =========================================================
# ROUTINE / OLD ONE OUT - MODEL TRAINING
# =========================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

DATASET_PATH = os.path.join(
    BASE_DIR,
    "routine_adaptive_dementia_dataset",
    "routine_adaptive_dementia_v1.csv"
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "routine_difficulty_model.pkl"
)

# =========================================================
# LOAD DATASET
# =========================================================

df = pd.read_csv(DATASET_PATH)

print("\n========================================")
print("Routine ML Dataset Loaded")
print("========================================")

print("Rows:", len(df))
print("Columns:", len(df.columns))

# =========================================================
# FEATURES
# =========================================================

features = [
    "current_difficulty",
    "accuracy",
    "response_time",
    "total_attempts",
    "mistakes",
    "score",
    "previous_score",
]

X = df[features]
y = df["difficulty_change"]

# =========================================================
# TRAIN / TEST SPLIT
# =========================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print("\nTraining samples:", len(X_train))
print("Testing samples:", len(X_test))

# =========================================================
# RANDOM FOREST
# =========================================================

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=12,
    random_state=42,
    class_weight="balanced",
    n_jobs=-1
)

print("\nTraining Routine ML model...")

model.fit(
    X_train,
    y_train
)

# =========================================================
# PREDICTION
# =========================================================

y_pred = model.predict(X_test)

# =========================================================
# ACCURACY
# =========================================================

accuracy = accuracy_score(
    y_test,
    y_pred
)

print("\n========================================")
print("MODEL PERFORMANCE")
print("========================================")

print(
    f"Accuracy: {accuracy * 100:.2f}%"
)

# =========================================================
# CLASSIFICATION REPORT
# =========================================================

print("\nClassification Report:")
print(
    classification_report(
        y_test,
        y_pred
    )
)

# =========================================================
# CONFUSION MATRIX
# =========================================================

print("\nConfusion Matrix:")

labels = [
    "EASIER",
    "SAME",
    "HARDER"
]

cm = confusion_matrix(
    y_test,
    y_pred,
    labels=labels
)

print(
    pd.DataFrame(
        cm,
        index=labels,
        columns=labels
    )
)

# =========================================================
# FEATURE IMPORTANCE
# =========================================================

print("\nFeature Importance:")

importance = pd.DataFrame({
    "feature": features,
    "importance": model.feature_importances_
})

importance = importance.sort_values(
    by="importance",
    ascending=False
)

print(
    importance.to_string(index=False)
)

# =========================================================
# SAVE MODEL
# =========================================================

with open(
    MODEL_PATH,
    "wb"
) as file:
    pickle.dump(
        model,
        file
    )

print("\n========================================")
print("MODEL SAVED")
print("========================================")

print(
    "Model path:",
    MODEL_PATH
)
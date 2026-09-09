import pandas as pd
import pickle
import os

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

# ==========================================
# PATHS
# ==========================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATASET_PATH = os.path.join(
    BASE_DIR, "recognition_dataset", "recognition_adaptive_dementia_v2.csv"
)

MODEL_PATH = os.path.join(BASE_DIR, "recognition_difficulty_model.pkl")


# ==========================================
# LOAD DATASET
# ==========================================

print("Loading dataset...")

df = pd.read_csv(DATASET_PATH)

print("Dataset loaded:", df.shape)


# ==========================================
# FEATURES
# ==========================================

features = [
    "current_level",
    "accuracy",
    "response_time",
    "total_attempts",
    "mistakes",
    "previous_score",
    "hint_used",
    "difficulty_score",
]


X = df[features]

y = df["difficulty_change"]


# ==========================================
# CHECK CLASS DISTRIBUTION
# ==========================================

print("\nClass distribution:")

print(y.value_counts())


# ==========================================
# TRAIN / TEST SPLIT
# ==========================================

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)


print("\nTraining samples:", len(X_train))
print("Testing samples:", len(X_test))


# ==========================================
# RANDOM FOREST MODEL
# ==========================================

print("\nTraining Random Forest...")

model = RandomForestClassifier(
    n_estimators=200, max_depth=12, random_state=42, class_weight="balanced", n_jobs=-1
)


model.fit(X_train, y_train)


# ==========================================
# PREDICTION
# ==========================================

y_pred = model.predict(X_test)


# ==========================================
# ACCURACY
# ==========================================

accuracy = accuracy_score(y_test, y_pred)

print("\n======================================")
print("MODEL PERFORMANCE")
print("======================================")

print("\nAccuracy:", round(accuracy * 100, 2), "%")


# ==========================================
# CLASSIFICATION REPORT
# ==========================================

print("\nClassification Report:\n")

print(classification_report(y_test, y_pred))


# ==========================================
# CONFUSION MATRIX
# ==========================================

print("\nConfusion Matrix:\n")

print(confusion_matrix(y_test, y_pred))


# ==========================================
# FEATURE IMPORTANCE
# ==========================================

print("\nFeature Importance:\n")

importance = pd.DataFrame(
    {"feature": features, "importance": model.feature_importances_}
)

importance = importance.sort_values(by="importance", ascending=False)

print(importance.to_string(index=False))


# ==========================================
# SAVE MODEL
# ==========================================

with open(MODEL_PATH, "wb") as file:

    pickle.dump(model, file)


print("\n======================================")

print("Model saved successfully!")

print(MODEL_PATH)

print("======================================")

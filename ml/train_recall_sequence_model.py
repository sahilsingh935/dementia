import pandas as pd
import pickle

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# ================================
# 1. LOAD DATASET
# ================================

DATASET_PATH = "recall_sequence_dataset/" "recall_sequence_adaptive_dementia_v1.csv"

df = pd.read_csv(DATASET_PATH)

print("Dataset loaded successfully")
print("Rows:", len(df))
print("Columns:", list(df.columns))


# ================================
# 2. FEATURES
# ================================

features = [
    "sequence_length",
    "accuracy",
    "response_time",
    "total_attempts",
    "mistakes",
    "previous_score",
    "current_level",
]

X = df[features]

# Target
y = df["difficulty_change"]


# ================================
# 3. TRAIN / TEST SPLIT
# ================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y,
)

print("\nTraining rows:", len(X_train))
print("Testing rows:", len(X_test))


# ================================
# 4. TRAIN MODEL
# ================================

model = RandomForestClassifier(
    n_estimators=200,
    random_state=42,
    class_weight="balanced",
)

model.fit(X_train, y_train)


# ================================
# 5. TEST MODEL
# ================================

predictions = model.predict(X_test)

accuracy = accuracy_score(
    y_test,
    predictions,
)

print("\nModel Accuracy:")
print(f"{accuracy * 100:.2f}%")


print("\nClassification Report:")

print(
    classification_report(
        y_test,
        predictions,
    )
)


# ================================
# 6. SAVE MODEL
# ================================

MODEL_PATH = "recall_sequence_model.pkl"

with open(MODEL_PATH, "wb") as file:
    pickle.dump(model, file)


print("\nModel saved successfully!")
print("File:", MODEL_PATH)

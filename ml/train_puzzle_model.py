import os
import pickle
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# --------------------------------------------------
# 1. PATHS
# --------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATASET_PATH = os.path.join(
    BASE_DIR, "puzzle_dataset", "puzzle_adaptive_dementia_research_informed_v4.csv"
)

MODEL_PATH = os.path.join(BASE_DIR, "puzzle_difficulty_model_v4.pkl")


# --------------------------------------------------
# 2. LOAD DATASET
# --------------------------------------------------

df = pd.read_csv(DATASET_PATH)

print("Dataset loaded successfully")
print("Total rows:", len(df))


# --------------------------------------------------
# 3. FEATURES
# --------------------------------------------------

features = [
    "puzzle_pieces",
    "accuracy",
    "response_time",
    "attempts",
    "mistakes",
    "previous_score",
    "current_level",
]

X = df[features]

y = df["difficulty_change"]


# --------------------------------------------------
# 4. TRAIN / TEST SPLIT
# --------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)

print("Training rows:", len(X_train))
print("Testing rows:", len(X_test))


# --------------------------------------------------
# 5. RANDOM FOREST MODEL
# --------------------------------------------------

model = RandomForestClassifier(
    n_estimators=250,
    max_depth=12,
    min_samples_leaf=3,
    random_state=42,
    class_weight="balanced",
)


# --------------------------------------------------
# 6. TRAIN
# --------------------------------------------------

model.fit(X_train, y_train)

print("Model training completed")


# --------------------------------------------------
# 7. TEST MODEL
# --------------------------------------------------

predictions = model.predict(X_test)

accuracy = accuracy_score(y_test, predictions)

print()
print(f"Test Accuracy: {accuracy * 100:.2f}%")

print()
print("Classification Report:")

print(classification_report(y_test, predictions))


# --------------------------------------------------
# 8. SAVE MODEL
# --------------------------------------------------

with open(MODEL_PATH, "wb") as file:

    pickle.dump(model, file)


print()
print("Model saved successfully:")

print(MODEL_PATH)

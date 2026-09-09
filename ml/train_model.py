import pandas as pd
import pickle

from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, classification_report

data = pd.read_csv("dataset/adaptive_difficulty.csv")

print("Dataset loaded successfully!")
print("Total records:", len(data))

X = data[
    [
        "current_level",
        "accuracy",
        "response_time",
        "mistakes",
        "hints_used",
        "previous_score",
    ]
]

y = data["difficulty_change"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)

model = DecisionTreeClassifier(max_depth=6, min_samples_leaf=10, random_state=42)

model.fit(X_train, y_train)

y_pred = model.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)

print("\nModel Accuracy:")
print(f"{accuracy * 100:.2f}%")

print("\nClassification Report:")
print(classification_report(y_test, y_pred))

with open("difficulty_model.pkl", "wb") as file:
    pickle.dump(model, file)

print("\nModel saved successfully as: difficulty_model.pkl")

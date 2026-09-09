import os
import numpy as np
import pandas as pd

# =========================================
# PATH
# =========================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATASET_DIR = os.path.join(BASE_DIR, "recall_sequence_dataset")

os.makedirs(DATASET_DIR, exist_ok=True)

CSV_PATH = os.path.join(DATASET_DIR, "recall_sequence_adaptive_v1.csv")


# =========================================
# RANDOM
# =========================================

rng = np.random.default_rng(42)

N = 30000


# =========================================
# CURRENT LEVEL
# =========================================

current_level = rng.integers(1, 6, N)


# =========================================
# SEQUENCE LENGTH
# =========================================

sequence_length = current_level + 2


# =========================================
# RESPONSE TIME
# =========================================

base_time = {1: 35, 2: 55, 3: 85, 4: 120, 5: 155}


response_time = np.array(
    [rng.normal(base_time[level], 12 + (level * 4)) for level in current_level]
)


response_time = np.clip(response_time, 10, 300).round(2)


# =========================================
# TOTAL ATTEMPTS
# =========================================

total_attempts = rng.choice([1, 2, 3, 4, 5], size=N, p=[0.50, 0.25, 0.12, 0.08, 0.05])


# =========================================
# ACCURACY
# =========================================

accuracy = (
    95
    - ((current_level - 1) * 7)
    - ((total_attempts - 1) * 7)
    - np.maximum(
        response_time - np.array([base_time[level] for level in current_level]), 0
    )
    * 0.10
    + rng.normal(0, 8, N)
)


accuracy = np.clip(accuracy, 0, 100).round(2)


# =========================================
# MISTAKES
# =========================================

mistakes = np.maximum(0, np.rint((100 - accuracy) / 25 + rng.normal(0, 0.5, N))).astype(
    int
)


mistakes = np.clip(mistakes, 0, 6)


# =========================================
# PREVIOUS SCORE
# =========================================

previous_score = np.clip(accuracy + rng.normal(0, 8, N) - mistakes * 2, 0, 100).round(2)


# =========================================
# TARGET
# =========================================

# Good performance
harder_condition = (
    (accuracy >= 88)
    & (mistakes <= 1)
    & (total_attempts <= 2)
    & (response_time <= np.array([base_time[level] for level in current_level]) + 20)
    & (previous_score >= 75)
)


# Poor performance
easier_condition = (
    (accuracy < 60)
    | (mistakes >= 3)
    | (total_attempts >= 4)
    | (response_time > np.array([base_time[level] for level in current_level]) + 45)
    | (previous_score < 55)
)


difficulty_change = np.where(
    harder_condition, "HARDER", np.where(easier_condition, "EASIER", "SAME")
)


# =========================================
# DATAFRAME
# =========================================

df = pd.DataFrame(
    {
        "sequence_length": sequence_length,
        "accuracy": accuracy,
        "response_time": response_time,
        "total_attempts": total_attempts,
        "mistakes": mistakes,
        "previous_score": previous_score,
        "current_level": current_level,
        "difficulty_change": difficulty_change,
    }
)


# =========================================
# SAVE
# =========================================

df.to_csv(CSV_PATH, index=False)


print("Recall Sequence dataset created!")

print("Location:", CSV_PATH)

print("\nTotal rows:", len(df))

print("\nClass distribution:")

print(df["difficulty_change"].value_counts())

import csv
import random
import os

NUM_RECORDS = 5000

output_dir = "dataset"
os.makedirs(output_dir, exist_ok=True)

output_file = os.path.join(output_dir, "adaptive_difficulty.csv")

random.seed(42)

rows = []

classes = ["EASIER", "SAME", "HARDER"]

for i in range(NUM_RECORDS):

    # Balanced classes
    difficulty_change = classes[i % 3]

    # =========================
    # EASIER
    # =========================

    if difficulty_change == "EASIER":

        current_level = random.randint(2, 5)

        accuracy = random.uniform(35, 70)
        response_time = random.uniform(6, 15)
        mistakes = random.randint(3, 10)
        hints_used = random.randint(1, 4)
        previous_score = random.uniform(35, 70)

    # =========================
    # SAME
    # =========================

    elif difficulty_change == "SAME":

        current_level = random.randint(1, 5)

        accuracy = random.uniform(65, 88)
        response_time = random.uniform(4, 10)
        mistakes = random.randint(1, 5)
        hints_used = random.randint(0, 3)
        previous_score = random.uniform(60, 88)

    # =========================
    # HARDER
    # =========================

    else:

        current_level = random.randint(1, 4)

        accuracy = random.uniform(85, 100)
        response_time = random.uniform(2, 7)
        mistakes = random.randint(0, 2)
        hints_used = random.randint(0, 1)
        previous_score = random.uniform(80, 100)

    rows.append(
        [
            current_level,
            round(accuracy, 2),
            round(response_time, 2),
            mistakes,
            hints_used,
            round(previous_score, 2),
            difficulty_change,
        ]
    )


# Shuffle dataset
random.shuffle(rows)


# Save CSV
with open(output_file, "w", newline="", encoding="utf-8") as file:

    writer = csv.writer(file)

    writer.writerow(
        [
            "current_level",
            "accuracy",
            "response_time",
            "mistakes",
            "hints_used",
            "previous_score",
            "difficulty_change",
        ]
    )

    writer.writerows(rows)


print(f"Dataset generated successfully: {NUM_RECORDS} records")
print(f"Saved at: {output_file}")

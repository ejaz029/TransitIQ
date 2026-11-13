
import json

from validation.anomaly_engine import run_anomaly_validation

with open("data/ground_truth/ground_truth.json") as f:
    truth = {
        item["case_id"]: item
        for item in json.load(f)
    }

results = run_anomaly_validation()

correct = 0

print("\nGROUND TRUTH COMPARISON")
print("-----------------------")

for result in results:
    expected = truth[result["case_id"]]["expected_decision"]

    actual = (
        result["detected"][0]["decision"]
        if result["detected"]
        else "NO_DETECTION"
    )

    passed = actual == expected
    correct += int(passed)

    print(
        result["case_id"],
        f"Expected: {expected}",
        f"Actual: {actual}",
        "PASS" if passed else "FAIL"
    )

accuracy = correct / len(results) * 100 if results else 0

print(f"\nDecision accuracy: {accuracy:.2f}%")
print(f"Correct decisions: {correct}/{len(results)}")

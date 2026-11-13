
import json
from pathlib import Path
from datetime import datetime

INPUT = Path("data/generated/anomaly_cases.json")
OUTPUT = Path("data/generated/validation_results.json")


def evaluate_case(case):
    facts = case["facts"]
    issues = []

    # Rule 1: Bus capacity
    if case["entity_type"] == "BUS":
        if facts["proposed_load"] > facts["capacity"]:
            issues.append("BUS_CAPACITY_EXCEEDED")

    # Rule 2: Accessibility compatibility
    if case["entity_type"] == "ASSIGNMENT":
        if (
            facts["student_accessibility_required"]
            and not facts["bus_accessible"]
        ):
            issues.append("INCOMPATIBLE_ROUTE")

    # Rule 3: Route travel-time feasibility
    if case["entity_type"] == "ROUTE":
        previous = datetime.strptime(
            facts["previous_arrival"], "%H:%M"
        )
        next_stop = datetime.strptime(
            facts["next_arrival"], "%H:%M"
        )

        gap = (next_stop - previous).total_seconds() / 60

        if gap < facts["required_travel_minutes"]:
            issues.append("IMPOSSIBLE_TRAVEL_TIME")

    # Rule 4: Guardian contact validity
    if case["entity_type"] == "GUARDIAN_CONTACT":
        if not facts["contact_valid"]:
            issues.append("INVALID_GUARDIAN_CONTACT")

    # Rule 5: Address exposure
    if case["entity_type"] == "ADDRESS":
        if (
            not facts["address_approved"]
            and facts["exposure_attempted"]
        ):
            issues.append("UNAPPROVED_ADDRESS_EXPOSED")

    decisions = {
        "BUS_CAPACITY_EXCEEDED": "REJECT",
        "INCOMPATIBLE_ROUTE": "REJECT",
        "IMPOSSIBLE_TRAVEL_TIME": "FLAG",
        "INVALID_GUARDIAN_CONTACT": "BLOCK_NOTIFICATION",
        "UNAPPROVED_ADDRESS_EXPOSED": "CRITICAL_ALERT"
    }

    detected = [
        {
            "issue_type": issue,
            "decision": decisions[issue]
        }
        for issue in issues
    ]

    return {
        "case_id": case["case_id"],
        "detected": detected,
        "passed": len(detected) > 0
    }


def run_anomaly_validation():
    with open(INPUT, "r") as f:
        cases = json.load(f)

    results = [evaluate_case(case) for case in cases]

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT, "w") as f:
        json.dump(results, f, indent=4)

    detected = sum(result["passed"] for result in results)

    print("\nANOMALY VALIDATION REPORT")
    print("-------------------------")
    print(f"Total scenarios: {len(results)}")
    print(f"Detected: {detected}")
    print(f"Missed: {len(results) - detected}")

    for result in results:
        print(
            result["case_id"],
            "DETECTED" if result["passed"] else "MISSED",
            result["detected"]
        )

    return results


if __name__ == "__main__":
    run_anomaly_validation()

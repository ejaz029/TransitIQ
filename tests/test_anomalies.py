from pathlib import Path
import subprocess
import sys


def run_anomaly_evaluation():
    root = Path(__file__).resolve().parents[1]
    return subprocess.run(
        [sys.executable, "evaluate_anomalies.py"],
        cwd=root,
        capture_output=True,
        text=True,
        timeout=60,
    )


def test_anomaly_evaluation_completes():
    result = run_anomaly_evaluation()
    assert result.returncode == 0, result.stdout + result.stderr


def test_all_predefined_anomalies_are_detected():
    result = run_anomaly_evaluation()
    assert "Total scenarios: 5" in result.stdout
    assert "Detected: 5" in result.stdout
    assert "Missed: 0" in result.stdout


def test_expected_anomaly_cases_are_evaluated():
    result = run_anomaly_evaluation()
    for case in ["ANOM-001", "ANOM-002", "ANOM-003", "ANOM-004", "ANOM-005"]:
        assert case in result.stdout

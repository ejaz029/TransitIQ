from pathlib import Path
import subprocess
import sys

from backend.main import app


def test_required_api_endpoints_exist():
    paths = app.openapi()["paths"]

    expected = [
        "/api/health",
        "/api/dashboard",
        "/api/students",
        "/api/buses",
        "/api/routes",
        "/api/assignments",
        "/api/attendance",
        "/api/notifications",
        "/api/exceptions",
    ]

    for endpoint in expected:
        assert endpoint in paths, f"Missing endpoint: {endpoint}"


def test_openapi_documentation():
    schema = app.openapi()

    assert schema["info"]["title"]
    assert schema["openapi"]
    assert len(schema["paths"]) > 0


def test_anomaly_validation():
    root = Path(__file__).resolve().parents[1]

    result = subprocess.run(
        [sys.executable, "evaluate_anomalies.py"],
        cwd=root,
        capture_output=True,
        text=True,
        timeout=60,
    )

    assert result.returncode == 0, result.stdout + result.stderr
    assert "Total scenarios: 5" in result.stdout
    assert "Detected: 5" in result.stdout
    assert "Missed: 0" in result.stdout

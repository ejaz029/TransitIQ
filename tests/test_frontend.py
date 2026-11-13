import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_frontend_package_configuration_exists():
    package_file = ROOT / "TransitIQ_frontend" / "package.json"
    assert package_file.is_file()


def test_frontend_has_build_script():
    package_file = ROOT / "TransitIQ_frontend" / "package.json"
    package = json.loads(package_file.read_text(encoding="utf-8"))
    assert "build" in package["scripts"]
    assert "vite build" in package["scripts"]["build"]

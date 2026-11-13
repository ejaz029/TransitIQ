from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_backend_entrypoint_exists():
    assert (ROOT / "backend" / "main.py").is_file()


def test_generator_and_validation_modules_exist():
    assert (ROOT / "generator" / "run.py").is_file()
    assert (ROOT / "validation" / "anomaly_engine.py").is_file()


def test_ground_truth_data_exists():
    assert (ROOT / "data" / "ground_truth" / "ground_truth.json").is_file()

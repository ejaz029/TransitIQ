from backend.main import app


def test_required_endpoints_exist():
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


def test_api_endpoints_use_valid_http_methods():
    paths = app.openapi()["paths"]
    allowed = {"get", "post", "put", "patch", "delete"}
    for path, operations in paths.items():
        for method in operations:
            assert method.lower() in allowed, f"Invalid method on {path}"

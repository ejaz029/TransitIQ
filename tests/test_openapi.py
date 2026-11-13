from backend.main import app


def test_openapi_schema_has_application_information():
    schema = app.openapi()
    assert schema["openapi"]
    assert schema["info"]["title"]
    assert schema["info"]["version"]


def test_openapi_contains_api_paths():
    schema = app.openapi()
    assert len(schema["paths"]) >= 9


def test_openapi_has_valid_operation_definitions():
    schema = app.openapi()
    for path, methods in schema["paths"].items():
        for method, operation in methods.items():
            assert isinstance(operation, dict)
            assert "responses" in operation

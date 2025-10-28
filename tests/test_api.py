import pytest
from fastapi.testclient import TestClient

# Import the FastAPI app
try:
    from src.app import app
except ImportError:
    app = None

client = TestClient(app) if app else None

@pytest.mark.skipif(app is None, reason="FastAPI app not found in src.app")
def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    # Check at least one activity exists
    assert data, "No activities returned"
    for name, details in data.items():
        assert "description" in details
        assert "schedule" in details
        assert "participants" in details
        assert "max_participants" in details

@pytest.mark.skipif(app is None, reason="FastAPI app not found in src.app")
def test_signup_and_delete_participant():
    # Find an activity name
    activities = client.get("/activities").json()
    activity = next(iter(activities))
    test_email = "pytest-user@mergington.edu"

    # Sign up
    signup = client.post(f"/activities/{activity}/signup?email={test_email}")
    assert signup.status_code in (200, 201)
    signup_data = signup.json()
    assert "message" in signup_data

    # Confirm participant is listed
    activities_after = client.get("/activities").json()
    assert test_email in activities_after[activity]["participants"]

    # Delete participant
    delete = client.delete(f"/activities/{activity}/signup?email={test_email}")
    assert delete.status_code == 200
    delete_data = delete.json()
    assert "message" in delete_data

    # Confirm participant is removed
    activities_final = client.get("/activities").json()
    assert test_email not in activities_final[activity]["participants"]

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from questionnaires.models import QuestionnaireType, Questionnaire

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(username="testuser", password="testpass123")


@pytest.fixture
def questionnaire(db):
    return QuestionnaireType.objects.create(
        title="Test Questionnaire",
        description="A test description",
        survey_json={
            "pages": [
                {"elements": [{"type": "text", "name": "q1", "title": "Question 1"}]}
            ]  # noqa: E501
        },
    )


@pytest.fixture
def questionnaire_with_owner(db, user):
    return QuestionnaireType.objects.create(
        title="Owned Questionnaire",
        description="Owned by a user",
        owner=user,
        survey_json={"pages": []},
    )


@pytest.fixture
def response_for(questionnaire):
    return Questionnaire.objects.create(
        questionnaire_type=questionnaire,
        answers={"q1": "Answer text"},
    )

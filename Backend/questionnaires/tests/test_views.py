import pytest

from questionnaires.models import QuestionnaireType, Questionnaire

TYPES_LIST_URL = "/api/questionnaire-types/"
INSTANCES_LIST_URL = "/api/questionnaires/"


def type_detail_url(pk):
    return f"/api/questionnaire-types/{pk}/"


def instance_detail_url(pk):
    return f"/api/questionnaires/{pk}/"


def by_token_url(share_token):
    return f"/api/questionnaires/by-token/{share_token}/"


def submit_url(share_token):
    return f"/api/questionnaires/by-token/{share_token}/submit/"


def pdf_url(pk):
    return f"/api/questionnaires/{pk}/pdf/"


# ── QuestionnaireType endpoints ────────────────────────────────────────────────


@pytest.mark.django_db
class TestQuestionnaireTypeListCreate:
    def test_list_returns_200(self, api_client):
        response = api_client.get(TYPES_LIST_URL)
        assert response.status_code == 200

    def test_list_empty(self, api_client):
        response = api_client.get(TYPES_LIST_URL)
        assert response.data == []

    def test_list_contains_created(self, api_client, questionnaire):
        response = api_client.get(TYPES_LIST_URL)
        assert len(response.data) == 1
        assert response.data[0]["title"] == questionnaire.title

    def test_create_valid(self, api_client):
        payload = {"title": "New Survey", "surveyJson": {"pages": []}}
        response = api_client.post(TYPES_LIST_URL, payload, format="json")
        assert response.status_code == 201
        assert response.data["title"] == "New Survey"
        assert QuestionnaireType.objects.count() == 1

    def test_create_missing_title(self, api_client):
        response = api_client.post(TYPES_LIST_URL, {}, format="json")
        assert response.status_code == 400
        assert "title" in response.data

    def test_create_sets_survey_json(self, api_client):
        payload = {"title": "Survey", "surveyJson": {"pages": [{"elements": []}]}}
        response = api_client.post(TYPES_LIST_URL, payload, format="json")
        assert response.status_code == 201
        q = QuestionnaireType.objects.get(id=response.data["id"])
        assert q.survey_json == {"pages": [{"elements": []}]}

    def test_create_returns_camel_case_fields(self, api_client):
        payload = {"title": "Camel Survey"}
        response = api_client.post(TYPES_LIST_URL, payload, format="json")
        assert "surveyJson" in response.data
        assert "createdAt" in response.data
        assert "updatedAt" in response.data


@pytest.mark.django_db
class TestQuestionnaireTypeRetrieveUpdateDelete:
    def test_retrieve_returns_200(self, api_client, questionnaire):
        response = api_client.get(type_detail_url(questionnaire.id))
        assert response.status_code == 200
        assert response.data["id"] == str(questionnaire.id)

    def test_retrieve_not_found(self, api_client):
        import uuid

        response = api_client.get(type_detail_url(uuid.uuid4()))
        assert response.status_code == 404

    def test_patch_title(self, api_client, questionnaire):
        response = api_client.patch(
            type_detail_url(questionnaire.id), {"title": "Patched"}, format="json"
        )
        assert response.status_code == 200
        questionnaire.refresh_from_db()
        assert questionnaire.title == "Patched"

    def test_patch_survey_json(self, api_client, questionnaire):
        new_json = {"pages": [{"elements": [{"type": "checkbox", "name": "q2"}]}]}
        response = api_client.patch(
            type_detail_url(questionnaire.id), {"surveyJson": new_json}, format="json"
        )
        assert response.status_code == 200
        questionnaire.refresh_from_db()
        assert questionnaire.survey_json == new_json

    def test_delete_removes_questionnaire_type(self, api_client, questionnaire):
        response = api_client.delete(type_detail_url(questionnaire.id))
        assert response.status_code == 204
        assert not QuestionnaireType.objects.filter(id=questionnaire.id).exists()

    def test_put_not_allowed(self, api_client, questionnaire):
        response = api_client.put(
            type_detail_url(questionnaire.id), {"title": "No PUT"}, format="json"
        )
        assert response.status_code == 405


# ── Questionnaire instance endpoints ──────────────────────────────────────────


@pytest.mark.django_db
class TestQuestionnaireInstanceListCreate:
    def test_list_returns_200(self, api_client):
        response = api_client.get(INSTANCES_LIST_URL)
        assert response.status_code == 200

    def test_list_empty(self, api_client):
        response = api_client.get(INSTANCES_LIST_URL)
        assert response.data == []

    def test_list_contains_instance(self, api_client, response_for):
        response = api_client.get(INSTANCES_LIST_URL)
        assert len(response.data) == 1

    def test_create_instance_valid(self, api_client, questionnaire):
        payload = {"questionnaireTypeId": str(questionnaire.id)}
        response = api_client.post(INSTANCES_LIST_URL, payload, format="json")
        assert response.status_code == 201
        assert (
            Questionnaire.objects.filter(questionnaire_type=questionnaire).count() == 1
        )

    def test_create_instance_returns_camel_case(self, api_client, questionnaire):
        payload = {"questionnaireTypeId": str(questionnaire.id)}
        response = api_client.post(INSTANCES_LIST_URL, payload, format="json")
        assert response.status_code == 201
        assert "shareToken" in response.data
        assert "createdAt" in response.data
        assert response.data["submittedAt"] is None


@pytest.mark.django_db
class TestQuestionnaireInstanceByToken:
    def test_get_by_token_returns_instance(self, api_client, response_for):
        url = by_token_url(response_for.share_token)
        response = api_client.get(url)
        assert response.status_code == 200
        assert response.data["id"] == str(response_for.id)
        assert "questionnaireType" in response.data

    def test_get_by_token_not_found(self, api_client):
        import uuid

        response = api_client.get(by_token_url(uuid.uuid4()))
        assert response.status_code == 404

    def test_submit_sets_answers_and_submitted_at(self, api_client, response_for):
        url = submit_url(response_for.share_token)
        payload = {"answers": {"q1": "hello"}}
        response = api_client.patch(url, payload, format="json")
        assert response.status_code == 200
        response_for.refresh_from_db()
        assert response_for.answers == {"q1": "hello"}
        assert response_for.submitted_at is not None

    def test_submit_returns_409_on_resubmission(self, api_client, response_for):
        url = submit_url(response_for.share_token)
        payload = {"answers": {"q1": "first"}}
        api_client.patch(url, payload, format="json")
        second = api_client.patch(url, {"answers": {"q1": "second"}}, format="json")
        assert second.status_code == 409


@pytest.mark.django_db
class TestResponsePdfView:
    def test_returns_200_with_pdf_content_type(
        self, api_client, questionnaire, response_for
    ):
        response = api_client.get(pdf_url(response_for.id))
        assert response.status_code == 200
        assert response["Content-Type"] == "application/pdf"

    def test_pdf_bytes_non_empty(self, api_client, questionnaire, response_for):
        response = api_client.get(pdf_url(response_for.id))
        assert len(response.content) > 100

    def test_content_disposition_contains_title(
        self, api_client, questionnaire, response_for
    ):
        response = api_client.get(pdf_url(response_for.id))
        assert "Content-Disposition" in response
        assert "Test-Questionnaire" in response["Content-Disposition"]

    def test_unknown_instance_returns_404(self, api_client):
        import uuid

        response = api_client.get(pdf_url(uuid.uuid4()))
        assert response.status_code == 404

    def test_empty_survey_json_returns_400(self, api_client, db):
        q = QuestionnaireType.objects.create(title="Empty", survey_json={})
        r = Questionnaire.objects.create(questionnaire_type=q, answers={})
        response = api_client.get(pdf_url(r.id))
        assert response.status_code == 400

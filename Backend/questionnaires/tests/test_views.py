import pytest

from questionnaires.models import QuestionnaireType, Questionnaire

QUESTIONNAIRES_LIST_URL = "/api/questionnaires/"


def detail_url(pk):
    return f"/api/questionnaires/{pk}/"


def responses_url(pk):
    return f"/api/questionnaires/{pk}/responses/"


@pytest.mark.django_db
class TestQuestionnaireListCreate:
    def test_list_returns_200(self, api_client):
        response = api_client.get(QUESTIONNAIRES_LIST_URL)
        assert response.status_code == 200

    def test_list_empty(self, api_client):
        response = api_client.get(QUESTIONNAIRES_LIST_URL)
        assert response.data == []

    def test_list_contains_created(self, api_client, questionnaire):
        response = api_client.get(QUESTIONNAIRES_LIST_URL)
        assert len(response.data) == 1
        assert response.data[0]["title"] == questionnaire.title

    def test_create_valid(self, api_client):
        payload = {"title": "New Survey", "surveyJson": {"pages": []}}
        response = api_client.post(QUESTIONNAIRES_LIST_URL, payload, format="json")
        assert response.status_code == 201
        assert response.data["title"] == "New Survey"
        assert QuestionnaireType.objects.count() == 1

    def test_create_missing_title(self, api_client):
        response = api_client.post(QUESTIONNAIRES_LIST_URL, {}, format="json")
        assert response.status_code == 400
        assert "title" in response.data

    def test_create_sets_survey_json(self, api_client):
        payload = {"title": "Survey", "surveyJson": {"pages": [{"elements": []}]}}
        response = api_client.post(QUESTIONNAIRES_LIST_URL, payload, format="json")
        assert response.status_code == 201
        q = QuestionnaireType.objects.get(id=response.data["id"])
        assert q.survey_json == {"pages": [{"elements": []}]}

    def test_create_returns_camel_case_fields(self, api_client):
        payload = {"title": "Camel Survey"}
        response = api_client.post(QUESTIONNAIRES_LIST_URL, payload, format="json")
        assert "surveyJson" in response.data
        assert "createdAt" in response.data
        assert "updatedAt" in response.data


@pytest.mark.django_db
class TestQuestionnaireRetrieveUpdateDelete:
    def test_retrieve_returns_200(self, api_client, questionnaire):
        response = api_client.get(detail_url(questionnaire.id))
        assert response.status_code == 200
        assert response.data["id"] == str(questionnaire.id)

    def test_retrieve_not_found(self, api_client):
        import uuid

        response = api_client.get(detail_url(uuid.uuid4()))
        assert response.status_code == 404

    def test_patch_title(self, api_client, questionnaire):
        response = api_client.patch(
            detail_url(questionnaire.id), {"title": "Patched"}, format="json"
        )
        assert response.status_code == 200
        questionnaire.refresh_from_db()
        assert questionnaire.title == "Patched"

    def test_patch_survey_json(self, api_client, questionnaire):
        new_json = {"pages": [{"elements": [{"type": "checkbox", "name": "q2"}]}]}
        response = api_client.patch(
            detail_url(questionnaire.id), {"surveyJson": new_json}, format="json"
        )
        assert response.status_code == 200
        questionnaire.refresh_from_db()
        assert questionnaire.survey_json == new_json

    def test_delete_removes_questionnaire(self, api_client, questionnaire):
        response = api_client.delete(detail_url(questionnaire.id))
        assert response.status_code == 204
        assert not QuestionnaireType.objects.filter(id=questionnaire.id).exists()

    def test_put_not_allowed(self, api_client, questionnaire):
        response = api_client.put(
            detail_url(questionnaire.id), {"title": "No PUT"}, format="json"
        )
        assert response.status_code == 405


@pytest.mark.django_db
class TestResponseListCreate:
    def test_list_empty(self, api_client, questionnaire):
        response = api_client.get(responses_url(questionnaire.id))
        assert response.status_code == 200
        assert response.data == []

    def test_list_contains_response(self, api_client, questionnaire, response_for):
        response = api_client.get(responses_url(questionnaire.id))
        assert response.status_code == 200
        assert len(response.data) == 1

    def test_list_scoped_to_questionnaire(self, api_client, db):
        QuestionnaireType.objects.create(title="Q1")
        q2 = QuestionnaireType.objects.create(title="Q2")
        Questionnaire.objects.create(
            questionnaire_type=QuestionnaireType.objects.get(title="Q1"), answers={}
        )
        response = api_client.get(responses_url(q2.id))
        assert response.data == []

    def test_create_response_valid(self, api_client, questionnaire):
        payload = {"answers": {"q1": "hello"}}
        response = api_client.post(
            responses_url(questionnaire.id), payload, format="json"
        )
        assert response.status_code == 201
        assert (
            Questionnaire.objects.filter(questionnaire_type=questionnaire).count() == 1
        )  # noqa: E501

    def test_create_response_sets_questionnaire(self, api_client, questionnaire):
        payload = {"answers": {"q1": "value"}}
        response = api_client.post(
            responses_url(questionnaire.id), payload, format="json"
        )
        assert response.status_code == 201
        assert response.data["questionnaireTypeId"] == str(questionnaire.id)

    def test_create_response_returns_camel_case(self, api_client, questionnaire):
        payload = {"answers": {}}
        response = api_client.post(
            responses_url(questionnaire.id), payload, format="json"
        )
        assert "questionnaireTypeId" in response.data
        assert "submittedAt" in response.data


def pdf_url(questionnaire_pk, response_pk):
    return f"/api/questionnaires/{questionnaire_pk}/responses/{response_pk}/pdf/"


@pytest.mark.django_db
class TestResponsePdfView:
    def test_returns_200_with_pdf_content_type(
        self, api_client, questionnaire, response_for
    ):
        response = api_client.get(pdf_url(questionnaire.id, response_for.id))
        assert response.status_code == 200
        assert response["Content-Type"] == "application/pdf"

    def test_pdf_bytes_non_empty(self, api_client, questionnaire, response_for):
        response = api_client.get(pdf_url(questionnaire.id, response_for.id))
        assert len(response.content) > 100

    def test_content_disposition_contains_title(
        self, api_client, questionnaire, response_for
    ):
        response = api_client.get(pdf_url(questionnaire.id, response_for.id))
        assert "Content-Disposition" in response
        assert "Test-Questionnaire" in response["Content-Disposition"]

    def test_unknown_questionnaire_returns_404(self, api_client, response_for):
        import uuid

        response = api_client.get(pdf_url(uuid.uuid4(), response_for.id))
        assert response.status_code == 404

    def test_unknown_response_returns_404(self, api_client, questionnaire):
        import uuid

        response = api_client.get(pdf_url(questionnaire.id, uuid.uuid4()))
        assert response.status_code == 404

    def test_empty_survey_json_returns_400(self, api_client, db):
        q = QuestionnaireType.objects.create(title="Empty", survey_json={})
        r = Questionnaire.objects.create(questionnaire_type=q, answers={})
        response = api_client.get(pdf_url(q.id, r.id))
        assert response.status_code == 400

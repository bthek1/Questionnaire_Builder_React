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

    def test_submit_sets_survey_json_snapshot(
        self, api_client, response_for, questionnaire
    ):
        url = submit_url(response_for.share_token)
        api_client.patch(url, {"answers": {"q1": "hello"}}, format="json")
        response_for.refresh_from_db()
        assert response_for.survey_json_snapshot == questionnaire.survey_json

    def test_submit_snapshot_in_response_body(
        self, api_client, response_for, questionnaire
    ):
        url = submit_url(response_for.share_token)
        response = api_client.patch(url, {"answers": {"q1": "hello"}}, format="json")
        assert response.status_code == 200
        assert response.data["surveyJsonSnapshot"] == questionnaire.survey_json

    def test_submit_returns_409_on_resubmission(self, api_client, response_for):
        url = submit_url(response_for.share_token)
        payload = {"answers": {"q1": "first"}}
        api_client.patch(url, payload, format="json")
        second = api_client.patch(url, {"answers": {"q1": "second"}}, format="json")
        assert second.status_code == 409

    def test_submit_saves_metrics_from_payload(self, api_client, response_for):
        url = submit_url(response_for.share_token)
        payload = {"answers": {"q1": "hello"}, "metrics": {"total_score": 42}}
        response = api_client.patch(url, payload, format="json")
        assert response.status_code == 200
        response_for.refresh_from_db()
        assert response_for.metrics == {"total_score": 42}

    def test_submit_metrics_in_response_body(self, api_client, response_for):
        url = submit_url(response_for.share_token)
        payload = {"answers": {"q1": "hello"}, "metrics": {"risk": "low"}}
        response = api_client.patch(url, payload, format="json")
        assert response.status_code == 200
        assert response.data["metrics"] == {"risk": "low"}

    def test_submit_without_metrics_defaults_to_empty_dict(
        self, api_client, response_for
    ):
        url = submit_url(response_for.share_token)
        response = api_client.patch(url, {"answers": {"q1": "hello"}}, format="json")
        assert response.status_code == 200
        response_for.refresh_from_db()
        assert response_for.metrics == {}


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


# ── Battery endpoints ──────────────────────────────────────────────────────────

from questionnaires.models import Battery, BatteryType, create_battery

BATTERY_TYPES_URL = "/api/battery-types/"
BATTERIES_URL = "/api/batteries/"


def battery_type_detail_url(pk):
    return f"/api/battery-types/{pk}/"


def battery_detail_url(pk):
    return f"/api/batteries/{pk}/"


def battery_by_token_url(token):
    return f"/api/batteries/by-token/{token}/"


@pytest.mark.django_db
class TestBatteryTypeViewSet:
    def test_list_empty(self, api_client):
        response = api_client.get(BATTERY_TYPES_URL)
        assert response.status_code == 200
        assert response.data == []

    def test_create(self, api_client):
        payload = {"title": "BT1", "questionnaireTypeIds": []}
        response = api_client.post(BATTERY_TYPES_URL, payload, format="json")
        assert response.status_code == 201
        assert response.data["title"] == "BT1"
        assert BatteryType.objects.count() == 1

    def test_retrieve(self, api_client, db):
        bt = BatteryType.objects.create(title="BT2")
        response = api_client.get(battery_type_detail_url(bt.id))
        assert response.status_code == 200
        assert response.data["id"] == str(bt.id)

    def test_partial_update(self, api_client, db):
        bt = BatteryType.objects.create(title="Old Title")
        response = api_client.patch(battery_type_detail_url(bt.id), {"title": "New Title"}, format="json")
        assert response.status_code == 200
        assert response.data["title"] == "New Title"

    def test_destroy(self, api_client, db):
        bt = BatteryType.objects.create(title="To Delete")
        response = api_client.delete(battery_type_detail_url(bt.id))
        assert response.status_code == 204
        assert not BatteryType.objects.filter(id=bt.id).exists()


@pytest.mark.django_db
class TestBatteryViewSet:
    def _setup(self, db):
        qt1 = QuestionnaireType.objects.create(title="Survey A")
        qt2 = QuestionnaireType.objects.create(title="Survey B")
        bt = BatteryType.objects.create(
            title="Two Survey Battery",
            questionnaire_type_ids=[str(qt1.id), str(qt2.id)],
        )
        return bt, qt1, qt2

    def test_list_empty(self, api_client):
        response = api_client.get(BATTERIES_URL)
        assert response.status_code == 200
        assert response.data == []

    def test_create_battery_creates_questionnaires(self, api_client, db):
        bt, qt1, qt2 = self._setup(db)
        response = api_client.post(BATTERIES_URL, {"battery_type": str(bt.id), "name": "Run 1"}, format="json")
        assert response.status_code == 201
        assert response.data["name"] == "Run 1"
        battery_id = response.data["id"]
        battery = Battery.objects.get(id=battery_id)
        assert battery.questionnaires.count() == 2

    def test_create_battery_correct_battery_order(self, api_client, db):
        bt, qt1, qt2 = self._setup(db)
        response = api_client.post(BATTERIES_URL, {"battery_type": str(bt.id)}, format="json")
        assert response.status_code == 201
        battery_id = response.data["id"]
        battery = Battery.objects.get(id=battery_id)
        orders = sorted(battery.questionnaires.values_list("battery_order", flat=True))
        assert orders == [0, 1]

    def test_by_token_returns_correct_shape(self, api_client, db):
        bt, qt1, qt2 = self._setup(db)
        battery = create_battery(bt, "Test")
        response = api_client.get(battery_by_token_url(battery.share_token))
        assert response.status_code == 200
        assert response.data["id"] == str(battery.id)
        assert "questionnaires" in response.data
        assert len(response.data["questionnaires"]) == 2

    def test_by_token_invalid_returns_404(self, api_client, db):
        response = api_client.get(battery_by_token_url("00000000-0000-0000-0000-000000000000"))
        assert response.status_code == 404

    def test_destroy(self, api_client, db):
        bt = BatteryType.objects.create(title="To Delete")
        battery = create_battery(bt)
        response = api_client.delete(battery_detail_url(battery.id))
        assert response.status_code == 204
        assert not Battery.objects.filter(id=battery.id).exists()

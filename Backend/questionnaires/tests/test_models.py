import pytest

from questionnaires.models import (
    Battery,
    BatteryType,
    Questionnaire,
    QuestionnaireType,
    create_battery,
)


@pytest.mark.django_db
class TestQuestionnaireModel:
    def test_creation_defaults(self):
        q = QuestionnaireType.objects.create(title="My Survey")
        assert q.pk is not None
        assert q.survey_json == {}
        assert q.description is None
        assert q.owner is None

    def test_creation_with_all_fields(self, user):
        q = QuestionnaireType.objects.create(
            title="Full Survey",
            description="Desc",
            owner=user,
            survey_json={"pages": []},
        )
        assert q.title == "Full Survey"
        assert q.description == "Desc"
        assert q.owner == user
        assert q.survey_json == {"pages": []}

    def test_id_is_uuid(self, questionnaire):
        import uuid

        assert isinstance(questionnaire.id, uuid.UUID)

    def test_timestamps_set_on_create(self, questionnaire):
        assert questionnaire.created_at is not None
        assert questionnaire.updated_at is not None

    def test_updated_at_changes_on_save(self, questionnaire):
        original = questionnaire.updated_at
        questionnaire.title = "Updated Title"
        questionnaire.save()
        questionnaire.refresh_from_db()
        assert questionnaire.updated_at >= original

    def test_ordering_newest_first(self, db):
        q1 = QuestionnaireType.objects.create(title="First")
        q2 = QuestionnaireType.objects.create(title="Second")
        qs = list(QuestionnaireType.objects.all())
        assert qs[0].pk == q2.pk
        assert qs[1].pk == q1.pk

    def test_owner_nullable_on_user_delete(self, questionnaire_with_owner, user):
        user.delete()
        questionnaire_with_owner.refresh_from_db()
        assert questionnaire_with_owner.owner is None

    def test_title_max_length(self, db):
        long_title = "a" * 256
        q = QuestionnaireType(title=long_title)
        with pytest.raises(Exception):  # noqa: B017, PT011
            q.full_clean()


@pytest.mark.django_db
class TestQuestionnaireResponseModel:
    def test_creation_defaults(self, questionnaire):
        r = Questionnaire.objects.create(
            questionnaire_type=questionnaire,
            answers_json={"q1": "hello"},
        )
        assert r.pk is not None
        assert r.answers_json == {"q1": "hello"}
        assert r.submitted_at is None
        assert r.created_at is not None
        assert r.updated_at is not None

    def test_id_is_uuid(self, response_for):
        import uuid

        assert isinstance(response_for.id, uuid.UUID)

    def test_share_token_is_uuid_and_unique(self, questionnaire):
        import uuid

        r1 = Questionnaire.objects.create(questionnaire_type=questionnaire)
        r2 = Questionnaire.objects.create(questionnaire_type=questionnaire)
        assert isinstance(r1.share_token, uuid.UUID)
        assert r1.share_token != r2.share_token

    def test_cascade_delete_with_questionnaire(self, questionnaire, response_for):
        qr_id = response_for.id
        questionnaire.delete()
        assert not Questionnaire.objects.filter(id=qr_id).exists()

    def test_related_name_instances(self, questionnaire, response_for):
        assert questionnaire.instances.count() == 1

    def test_answers_json_default_is_dict(self, questionnaire):
        r = Questionnaire.objects.create(questionnaire_type=questionnaire)
        assert r.answers_json == {}

    def test_questionnaire_json_snapshot_default_is_empty_dict(self, questionnaire):
        r = Questionnaire.objects.create(questionnaire_type=questionnaire)
        assert r.questionnaire_json_snapshot == {}

    def test_questionnaire_json_snapshot_not_set_when_unsubmitted(self, questionnaire):
        r = Questionnaire.objects.create(
            questionnaire_type=questionnaire, answers_json={"q1": "hello"}
        )
        assert r.submitted_at is None
        assert r.questionnaire_json_snapshot == {}

    def test_ordering_newest_first(self, questionnaire):
        r1 = Questionnaire.objects.create(questionnaire_type=questionnaire)
        r2 = Questionnaire.objects.create(questionnaire_type=questionnaire)
        instances = list(Questionnaire.objects.all())
        assert instances[0].pk == r2.pk
        assert instances[1].pk == r1.pk

    def test_str_includes_type_title_and_name(self, questionnaire):
        r = Questionnaire.objects.create(
            questionnaire_type=questionnaire, name="My Run"
        )
        assert questionnaire.title in str(r)
        assert "My Run" in str(r)

    def test_str_falls_back_to_token_when_no_name(self, questionnaire):
        r = Questionnaire.objects.create(questionnaire_type=questionnaire)
        assert questionnaire.title in str(r)
        assert str(r.share_token) in str(r)

    def test_metrics_json_default_is_empty_dict(self, questionnaire):
        r = Questionnaire.objects.create(questionnaire_type=questionnaire)
        assert r.metrics_json == {}

    def test_metrics_json_round_trips_non_empty_dict(self, questionnaire):
        r = Questionnaire.objects.create(
            questionnaire_type=questionnaire,
            metrics_json={"total_score": 42, "risk_level": "medium"},
        )
        r.refresh_from_db()
        assert r.metrics_json == {"total_score": 42, "risk_level": "medium"}


@pytest.mark.django_db
class TestQuestionnaireTypeRelatedName:
    def test_questionnaire_types_related_name(self, questionnaire_with_owner, user):
        assert user.questionnaire_types.count() == 1
        assert user.questionnaire_types.first().pk == questionnaire_with_owner.pk


@pytest.mark.django_db
class TestBatteryModels:
    def _make_battery_type(self, qt_ids=None):
        if qt_ids is None:
            qt_ids = []
        return BatteryType.objects.create(
            title="My Battery", questionnaire_type_ids=qt_ids
        )

    def test_battery_type_str(self, db):
        bt = BatteryType.objects.create(title="Demo Battery")
        assert str(bt) == "Demo Battery"

    def test_battery_str(self, db):
        bt = BatteryType.objects.create(title="Demo Battery")
        b = Battery.objects.create(battery_type=bt, name="Cohort A")
        assert "Demo Battery" in str(b)
        assert "Cohort A" in str(b)

    def test_battery_str_fallback_to_token(self, db):
        bt = BatteryType.objects.create(title="Demo Battery")
        b = Battery.objects.create(battery_type=bt)
        assert "Demo Battery" in str(b)
        assert str(b.share_token) in str(b)

    def test_create_battery_creates_questionnaires_in_order(self, db):
        qt1 = QuestionnaireType.objects.create(title="Survey 1")
        qt2 = QuestionnaireType.objects.create(title="Survey 2")
        qt3 = QuestionnaireType.objects.create(title="Survey 3")
        bt = BatteryType.objects.create(
            title="Three Survey Battery",
            questionnaire_type_ids=[str(qt1.id), str(qt2.id), str(qt3.id)],
        )
        battery = create_battery(bt, "Run A")
        assert battery.pk is not None
        qs = list(battery.questionnaires.order_by("battery_order"))
        assert len(qs) == 3
        assert qs[0].questionnaire_type_id == qt1.id
        assert qs[1].questionnaire_type_id == qt2.id
        assert qs[2].questionnaire_type_id == qt3.id

    def test_create_battery_battery_order_sequential(self, db):
        qt1 = QuestionnaireType.objects.create(title="Survey A")
        qt2 = QuestionnaireType.objects.create(title="Survey B")
        bt = BatteryType.objects.create(
            title="Two Survey Battery",
            questionnaire_type_ids=[str(qt1.id), str(qt2.id)],
        )
        battery = create_battery(bt)
        orders = sorted(battery.questionnaires.values_list("battery_order", flat=True))
        assert orders == [0, 1]

    def test_deleting_battery_sets_questionnaire_battery_null(self, db):
        qt = QuestionnaireType.objects.create(title="Survey X")
        bt = BatteryType.objects.create(
            title="Single Survey Battery",
            questionnaire_type_ids=[str(qt.id)],
        )
        battery = create_battery(bt)
        q_id = battery.questionnaires.first().id
        battery.delete()
        q = Questionnaire.objects.get(id=q_id)
        assert q.battery is None

    def test_create_battery_empty_questionnaire_type_ids(self, db):
        bt = BatteryType.objects.create(
            title="Empty Battery", questionnaire_type_ids=[]
        )
        battery = create_battery(bt)
        assert battery.questionnaires.count() == 0

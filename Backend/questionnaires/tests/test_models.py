import pytest

from questionnaires.models import Questionnaire, QuestionnaireResponse


@pytest.mark.django_db
class TestQuestionnaireModel:
    def test_creation_defaults(self):
        q = Questionnaire.objects.create(title="My Survey")
        assert q.pk is not None
        assert q.survey_json == {}
        assert q.description is None
        assert q.owner is None

    def test_creation_with_all_fields(self, user):
        q = Questionnaire.objects.create(
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
        q1 = Questionnaire.objects.create(title="First")
        q2 = Questionnaire.objects.create(title="Second")
        qs = list(Questionnaire.objects.all())
        assert qs[0].pk == q2.pk
        assert qs[1].pk == q1.pk

    def test_owner_nullable_on_user_delete(self, questionnaire_with_owner, user):
        user.delete()
        questionnaire_with_owner.refresh_from_db()
        assert questionnaire_with_owner.owner is None

    def test_title_max_length(self, db):
        long_title = "a" * 256
        q = Questionnaire(title=long_title)
        with pytest.raises(Exception):  # noqa: B017, PT011
            q.full_clean()


@pytest.mark.django_db
class TestQuestionnaireResponseModel:
    def test_creation_defaults(self, questionnaire):
        r = QuestionnaireResponse.objects.create(
            questionnaire=questionnaire,
            answers={"q1": "hello"},
        )
        assert r.pk is not None
        assert r.answers == {"q1": "hello"}
        assert r.submitted_at is not None

    def test_id_is_uuid(self, response_for):
        import uuid

        assert isinstance(response_for.id, uuid.UUID)

    def test_cascade_delete_with_questionnaire(self, questionnaire, response_for):
        qr_id = response_for.id
        questionnaire.delete()
        assert not QuestionnaireResponse.objects.filter(id=qr_id).exists()

    def test_related_name_responses(self, questionnaire, response_for):
        assert questionnaire.responses.count() == 1

    def test_answers_default_is_list(self, questionnaire):
        r = QuestionnaireResponse.objects.create(questionnaire=questionnaire)
        assert r.answers == []

import pytest

from questionnaires.serializers import (
    QuestionnaireResponseSerializer,
    QuestionnaireSerializer,
)


@pytest.mark.django_db
class TestQuestionnaireSerializer:
    def test_serializes_expected_fields(self, questionnaire):
        data = QuestionnaireSerializer(questionnaire).data
        assert set(data.keys()) == {"id", "title", "description", "questions", "surveyJson", "createdAt", "updatedAt"}

    def test_survey_json_camel_case(self, questionnaire):
        data = QuestionnaireSerializer(questionnaire).data
        assert "surveyJson" in data
        assert "survey_json" not in data

    def test_created_at_camel_case(self, questionnaire):
        data = QuestionnaireSerializer(questionnaire).data
        assert "createdAt" in data
        assert "created_at" not in data

    def test_id_is_read_only(self):
        import uuid
        serializer = QuestionnaireSerializer(data={"id": str(uuid.uuid4()), "title": "Test"})
        assert serializer.is_valid()
        assert "id" not in serializer.validated_data

    def test_valid_create(self):
        serializer = QuestionnaireSerializer(data={"title": "New Survey"})
        assert serializer.is_valid(), serializer.errors

    def test_title_required(self):
        serializer = QuestionnaireSerializer(data={})
        assert not serializer.is_valid()
        assert "title" in serializer.errors

    def test_survey_json_not_required(self):
        serializer = QuestionnaireSerializer(data={"title": "No JSON"})
        assert serializer.is_valid(), serializer.errors

    def test_partial_update(self, questionnaire):
        serializer = QuestionnaireSerializer(questionnaire, data={"title": "Updated"}, partial=True)
        assert serializer.is_valid(), serializer.errors
        instance = serializer.save()
        assert instance.title == "Updated"

    def test_survey_json_saves_to_snake_case_field(self, db):
        serializer = QuestionnaireSerializer(data={"title": "Test", "surveyJson": {"pages": []}})
        assert serializer.is_valid(), serializer.errors
        instance = serializer.save()
        assert instance.survey_json == {"pages": []}


@pytest.mark.django_db
class TestQuestionnaireResponseSerializer:
    def test_serializes_expected_fields(self, response_for):
        data = QuestionnaireResponseSerializer(response_for).data
        assert set(data.keys()) == {"id", "questionnaireId", "answers", "submittedAt"}

    def test_questionnaire_id_camel_case(self, response_for):
        data = QuestionnaireResponseSerializer(response_for).data
        assert "questionnaireId" in data
        assert str(response_for.questionnaire_id) == data["questionnaireId"]

    def test_submitted_at_camel_case(self, response_for):
        data = QuestionnaireResponseSerializer(response_for).data
        assert "submittedAt" in data

    def test_valid_create(self, questionnaire):
        serializer = QuestionnaireResponseSerializer(data={"answers": {"q1": "yes"}})
        assert serializer.is_valid(), serializer.errors

    def test_answers_defaults_to_empty_list(self, questionnaire):
        serializer = QuestionnaireResponseSerializer(data={})
        assert serializer.is_valid(), serializer.errors

import pytest

from questionnaires.serializers import (
    QuestionnaireSerializer,
    QuestionnaireTypeSerializer,
)


@pytest.mark.django_db
class TestQuestionnaireSerializer:
    def test_serializes_expected_fields(self, questionnaire):
        data = QuestionnaireTypeSerializer(questionnaire).data
        assert set(data.keys()) == {
            "id",
            "title",
            "description",
            "surveyJson",
            "createdAt",
            "updatedAt",
        }

    def test_survey_json_camel_case(self, questionnaire):
        data = QuestionnaireTypeSerializer(questionnaire).data
        assert "surveyJson" in data
        assert "survey_json" not in data
        assert "questions" not in data

    def test_created_at_camel_case(self, questionnaire):
        data = QuestionnaireTypeSerializer(questionnaire).data
        assert "createdAt" in data
        assert "created_at" not in data

    def test_id_is_read_only(self):
        import uuid

        serializer = QuestionnaireTypeSerializer(
            data={"id": str(uuid.uuid4()), "title": "Test"}
        )
        assert serializer.is_valid()
        assert "id" not in serializer.validated_data

    def test_valid_create(self):
        serializer = QuestionnaireTypeSerializer(data={"title": "New Survey"})
        assert serializer.is_valid(), serializer.errors

    def test_title_required(self):
        serializer = QuestionnaireTypeSerializer(data={})
        assert not serializer.is_valid()
        assert "title" in serializer.errors

    def test_survey_json_not_required(self):
        serializer = QuestionnaireTypeSerializer(data={"title": "No JSON"})
        assert serializer.is_valid(), serializer.errors

    def test_partial_update(self, questionnaire):
        serializer = QuestionnaireTypeSerializer(
            questionnaire, data={"title": "Updated"}, partial=True
        )
        assert serializer.is_valid(), serializer.errors
        instance = serializer.save()
        assert instance.title == "Updated"

    def test_survey_json_saves_to_snake_case_field(self, db):
        serializer = QuestionnaireTypeSerializer(
            data={"title": "Test", "surveyJson": {"pages": []}}
        )
        assert serializer.is_valid(), serializer.errors
        instance = serializer.save()
        assert instance.survey_json == {"pages": []}


@pytest.mark.django_db
class TestQuestionnaireResponseSerializer:
    def test_serializes_expected_fields(self, response_for):
        data = QuestionnaireSerializer(response_for).data
        assert set(data.keys()) == {
            "id",
            "questionnaireTypeId",
            "questionnaireType",
            "name",
            "shareToken",
            "answers",
            "submittedAt",
            "createdAt",
            "updatedAt",
        }

    def test_questionnaire_id_camel_case(self, response_for):
        data = QuestionnaireSerializer(response_for).data
        assert "questionnaireTypeId" in data
        assert str(response_for.questionnaire_type_id) == data["questionnaireTypeId"]

    def test_share_token_read_only(self, response_for):
        data = QuestionnaireSerializer(response_for).data
        assert "shareToken" in data
        assert data["shareToken"] is not None

    def test_submitted_at_none_by_default(self, response_for):
        data = QuestionnaireSerializer(response_for).data
        assert data["submittedAt"] is None

    def test_nested_questionnaire_type(self, response_for, questionnaire):
        data = QuestionnaireSerializer(response_for).data
        assert data["questionnaireType"]["id"] == str(questionnaire.id)
        assert data["questionnaireType"]["title"] == questionnaire.title

    def test_answers_defaults_to_empty_dict(self, questionnaire):
        from questionnaires.models import Questionnaire
        r = Questionnaire.objects.create(questionnaire_type=questionnaire)
        data = QuestionnaireSerializer(r).data
        assert data["answers"] == {}

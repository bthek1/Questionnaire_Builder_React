from rest_framework import serializers

from .models import Questionnaire, QuestionnaireResponse


class QuestionnaireSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)  # noqa: N815
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)  # noqa: N815
    surveyJson = serializers.JSONField(source="survey_json", required=False)  # noqa: N815

    class Meta:
        model = Questionnaire
        fields = ["id", "title", "description", "surveyJson", "createdAt", "updatedAt"]
        read_only_fields = ["id", "createdAt", "updatedAt"]


class QuestionnaireResponseSerializer(serializers.ModelSerializer):
    questionnaireId = serializers.UUIDField(source="questionnaire_id", read_only=True)  # noqa: N815
    submittedAt = serializers.DateTimeField(source="submitted_at", read_only=True)  # noqa: N815

    class Meta:
        model = QuestionnaireResponse
        fields = ["id", "questionnaireId", "answers", "submittedAt"]
        read_only_fields = ["id", "questionnaireId", "submittedAt"]

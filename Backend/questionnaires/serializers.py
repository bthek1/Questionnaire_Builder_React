from rest_framework import serializers

from .models import QuestionnaireType, QuestionnaireResponse


class QuestionnaireTypeSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)  # noqa: N815
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)  # noqa: N815
    surveyJson = serializers.JSONField(source="survey_json", required=False)  # noqa: N815

    class Meta:
        model = QuestionnaireType
        fields = ["id", "title", "description", "surveyJson", "createdAt", "updatedAt"]
        read_only_fields = ["id", "createdAt", "updatedAt"]


class QuestionnaireResponseSerializer(serializers.ModelSerializer):
    questionnaireTypeId = serializers.UUIDField(
        source="questionnaire_type_id", read_only=True
    )  # noqa: N815
    submittedAt = serializers.DateTimeField(source="submitted_at", read_only=True)  # noqa: N815

    class Meta:
        model = QuestionnaireResponse
        fields = ["id", "questionnaireTypeId", "answers", "submittedAt"]
        read_only_fields = ["id", "questionnaireTypeId", "submittedAt"]

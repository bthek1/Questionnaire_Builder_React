from rest_framework import serializers
from .models import QuestionnaireType, Questionnaire


class QuestionnaireTypeSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)  # noqa: N815
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)  # noqa: N815
    surveyJson = serializers.JSONField(source="survey_json", required=False)  # noqa: N815

    class Meta:
        model = QuestionnaireType
        fields = ["id", "title", "description", "surveyJson", "createdAt", "updatedAt"]
        read_only_fields = ["id", "createdAt", "updatedAt"]


class QuestionnaireSerializer(serializers.ModelSerializer):
    questionnaireTypeId = serializers.UUIDField(  # noqa: N815
        source="questionnaire_type_id"
    )
    questionnaireType = QuestionnaireTypeSerializer(  # noqa: N815
        source="questionnaire_type", read_only=True
    )
    shareToken = serializers.UUIDField(source="share_token", read_only=True)  # noqa: N815
    submittedAt = serializers.DateTimeField(source="submitted_at", read_only=True)  # noqa: N815
    surveyJsonSnapshot = serializers.JSONField(
        source="survey_json_snapshot", read_only=True
    )  # noqa: N815
    metrics = serializers.JSONField(required=False, default=dict)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)  # noqa: N815
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)  # noqa: N815

    class Meta:
        model = Questionnaire
        fields = [
            "id",
            "questionnaireTypeId",
            "questionnaireType",
            "name",
            "shareToken",
            "answers",
            "metrics",
            "submittedAt",
            "surveyJsonSnapshot",
            "createdAt",
            "updatedAt",
        ]
        read_only_fields = [
            "id",
            "questionnaireType",
            "shareToken",
            "submittedAt",
            "surveyJsonSnapshot",
            "createdAt",
            "updatedAt",
        ]

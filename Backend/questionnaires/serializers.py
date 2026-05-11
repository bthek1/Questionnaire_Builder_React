from rest_framework import serializers
from .models import Battery, BatteryType, QuestionnaireType, Questionnaire


class BatteryTypeSerializer(serializers.ModelSerializer):
    questionnaireTypeIds = serializers.JSONField(  # noqa: N815
        source="questionnaire_type_ids", required=False
    )
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)  # noqa: N815
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)  # noqa: N815

    class Meta:
        model = BatteryType
        fields = [
            "id",
            "title",
            "description",
            "questionnaireTypeIds",
            "createdAt",
            "updatedAt",
        ]
        read_only_fields = ["id", "createdAt", "updatedAt"]


class BatterySlotSerializer(serializers.ModelSerializer):
    order = serializers.IntegerField(source="battery_order", read_only=True)
    questionnaireId = serializers.UUIDField(source="id", read_only=True)  # noqa: N815
    shareToken = serializers.UUIDField(source="share_token", read_only=True)  # noqa: N815
    questionnaireTypeName = serializers.CharField(  # noqa: N815
        source="questionnaire_type.title", read_only=True
    )
    submittedAt = serializers.DateTimeField(source="submitted_at", read_only=True)  # noqa: N815

    class Meta:
        model = Questionnaire
        fields = [
            "order",
            "questionnaireId",
            "shareToken",
            "questionnaireTypeName",
            "submittedAt",
        ]


class BatterySerializer(serializers.ModelSerializer):
    batteryTypeId = serializers.UUIDField(source="battery_type_id")  # noqa: N815
    batteryTypeName = serializers.CharField(  # noqa: N815
        source="battery_type.title", read_only=True
    )
    shareToken = serializers.UUIDField(source="share_token", read_only=True)  # noqa: N815
    questionnaires = serializers.SerializerMethodField()
    isComplete = serializers.SerializerMethodField()  # noqa: N815
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)  # noqa: N815
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)  # noqa: N815

    class Meta:
        model = Battery
        fields = [
            "id",
            "batteryTypeId",
            "batteryTypeName",
            "name",
            "shareToken",
            "questionnaires",
            "isComplete",
            "createdAt",
            "updatedAt",
        ]
        read_only_fields = [
            "id",
            "batteryTypeName",
            "shareToken",
            "questionnaires",
            "isComplete",
            "createdAt",
            "updatedAt",
        ]

    def get_questionnaires(self, obj):
        qs = obj.questionnaires.select_related("questionnaire_type").order_by(
            "battery_order"
        )
        return BatterySlotSerializer(qs, many=True).data

    def get_isComplete(self, obj):  # noqa: N802
        qs = obj.questionnaires.all()
        if not qs.exists():
            return False
        return all(q.submitted_at is not None for q in qs)


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
        source="questionnaire_json_snapshot", read_only=True
    )  # noqa: N815
    answers = serializers.JSONField(source="answers_json", required=False, default=dict)  # noqa: N815
    metrics = serializers.JSONField(source="metrics_json", required=False, default=dict)
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

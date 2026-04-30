from rest_framework import serializers

from .models import QuestionnaireResponse


class QuestionnaireResponseSerializer(serializers.ModelSerializer):
    questionnaireId = serializers.UUIDField(source='questionnaire_id', read_only=True)
    submittedAt = serializers.DateTimeField(source='submitted_at', read_only=True)

    class Meta:
        model = QuestionnaireResponse
        fields = ['id', 'questionnaireId', 'answers', 'submittedAt']
        read_only_fields = ['id', 'questionnaireId', 'submittedAt']

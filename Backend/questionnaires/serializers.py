from rest_framework import serializers

from .models import Questionnaire


class QuestionnaireSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    surveyJson = serializers.JSONField(source='survey_json', required=False)

    class Meta:
        model = Questionnaire
        fields = ['id', 'title', 'description', 'questions', 'surveyJson', 'createdAt', 'updatedAt']
        read_only_fields = ['id', 'createdAt', 'updatedAt']

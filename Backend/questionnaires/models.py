import uuid

from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class Questionnaire(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='questionnaires')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    questions = models.JSONField(default=list, blank=True)
    survey_json = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']


class QuestionnaireResponse(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    questionnaire = models.ForeignKey(
        Questionnaire, on_delete=models.CASCADE, related_name='responses'
    )
    answers = models.JSONField(default=list)
    submitted_at = models.DateTimeField(auto_now_add=True)

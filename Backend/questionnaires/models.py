import uuid

from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class QuestionnaireType(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="questionnaire_types",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    survey_json = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title


class Questionnaire(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    questionnaire_type = models.ForeignKey(
        QuestionnaireType, on_delete=models.CASCADE, related_name="instances"
    )
    name = models.CharField(max_length=255, blank=True)
    share_token = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    answers = models.JSONField(default=dict, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.questionnaire_type.title} – {self.name or self.share_token}"

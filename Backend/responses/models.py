import uuid

from django.db import models

from questionnaires.models import Questionnaire


class QuestionnaireResponse(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    questionnaire = models.ForeignKey(
        Questionnaire, on_delete=models.CASCADE, related_name='responses'
    )
    answers = models.JSONField(default=list)
    submitted_at = models.DateTimeField(auto_now_add=True)

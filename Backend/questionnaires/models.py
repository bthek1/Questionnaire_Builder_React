import uuid

from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class BatteryType(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="battery_types",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    questionnaire_type_ids = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title


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
    questionnaire_json = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title


class Battery(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    battery_type = models.ForeignKey(
        BatteryType, on_delete=models.CASCADE, related_name="instances"
    )
    name = models.CharField(max_length=255, blank=True)
    share_token = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.battery_type.title} – {self.name or self.share_token}"


class Questionnaire(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    questionnaire_type = models.ForeignKey(
        QuestionnaireType, on_delete=models.CASCADE, related_name="instances"
    )
    battery = models.ForeignKey(
        Battery,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="questionnaires",
    )
    battery_order = models.PositiveIntegerField(null=True, blank=True)
    name = models.CharField(max_length=255, blank=True)
    share_token = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    answers_json = models.JSONField(default=dict, blank=True)
    questionnaire_json_snapshot = models.JSONField(default=dict, blank=True)
    metrics_json = models.JSONField(default=dict, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.questionnaire_type.title} – {self.name or self.share_token}"


def create_battery(battery_type: BatteryType, name: str = "") -> Battery:
    """Create a Battery and one Questionnaire per QuestionnaireType in order."""
    battery = Battery.objects.create(battery_type=battery_type, name=name)
    for index, qt_id in enumerate(battery_type.questionnaire_type_ids):
        Questionnaire.objects.create(
            questionnaire_type_id=qt_id,
            battery=battery,
            battery_order=index,
        )
    return battery

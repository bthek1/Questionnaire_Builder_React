import re
from datetime import date

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (
    Battery,
    BatteryType,
    QuestionnaireType,
    Questionnaire,
    create_battery,
)
from .pdf import generate_response_pdf
from .serializers import (
    BatterySerializer,
    BatteryTypeSerializer,
    QuestionnaireSerializer,
    QuestionnaireTypeSerializer,
)


class QuestionnaireTypeViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionnaireTypeSerializer
    permission_classes = [permissions.AllowAny]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return QuestionnaireType.objects.all()


class QuestionnaireViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionnaireSerializer
    permission_classes = [permissions.AllowAny]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return Questionnaire.objects.select_related("questionnaire_type").all()

    def perform_create(self, serializer):
        type_id = self.request.data.get("questionnaireTypeId")
        serializer.save(questionnaire_type_id=type_id)

    @action(detail=False, methods=["get"], url_path=r"by-token/(?P<share_token>[^/.]+)")
    def by_token(self, request, share_token=None):
        instance = get_object_or_404(
            Questionnaire.objects.select_related("questionnaire_type"),
            share_token=share_token,
        )
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(
        detail=False,
        methods=["get"],
        url_path=r"by-token/(?P<share_token>[^/.]+)/prior-answers",
    )
    def prior_answers(self, request, share_token=None):
        """Return the most recently submitted answers for the same QuestionnaireType,
        excluding the current questionnaire.  Used to pre-fill repeated assessments."""
        current = get_object_or_404(
            Questionnaire.objects.select_related("questionnaire_type"),
            share_token=share_token,
        )
        prior = (
            Questionnaire.objects.filter(
                questionnaire_type=current.questionnaire_type,
                submitted_at__isnull=False,
            )
            .exclude(pk=current.pk)
            .order_by("-submitted_at")
            .first()
        )
        answers = prior.answers_json if prior else {}
        return Response({"answers": answers})

    @action(
        detail=False,
        methods=["patch"],
        url_path=r"by-token/(?P<share_token>[^/.]+)/submit",
    )
    def submit(self, request, share_token=None):
        instance = get_object_or_404(
            Questionnaire.objects.select_related("questionnaire_type"),
            share_token=share_token,
        )
        if instance.submitted_at is not None:
            return Response(
                {"detail": "Already submitted."},
                status=status.HTTP_409_CONFLICT,
            )
        instance.answers_json = request.data.get("answers", {})
        instance.questionnaire_json_snapshot = (
            instance.questionnaire_type.survey_json or {}
        )
        instance.metrics_json = request.data.get("metrics", {})
        instance.submitted_at = timezone.now()
        instance.save(
            update_fields=[
                "answers_json",
                "questionnaire_json_snapshot",
                "metrics_json",
                "submitted_at",
                "updated_at",
            ]
        )
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="pdf")
    def pdf(self, request, pk=None):
        instance = get_object_or_404(
            Questionnaire.objects.select_related("questionnaire_type"), pk=pk
        )
        try:
            pdf_bytes = generate_response_pdf(instance.questionnaire_type, instance)
        except ValueError as exc:
            return HttpResponse(str(exc), status=400)

        safe_title = re.sub(r"[^A-Za-z0-9_-]", "-", instance.questionnaire_type.title)[
            :60
        ]
        filename = f"{safe_title}-{date.today().isoformat()}.pdf"
        http_response = HttpResponse(pdf_bytes, content_type="application/pdf")
        http_response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return http_response


class BatteryTypeViewSet(viewsets.ModelViewSet):
    serializer_class = BatteryTypeSerializer
    permission_classes = [permissions.AllowAny]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return BatteryType.objects.all()


class BatteryViewSet(viewsets.ModelViewSet):
    serializer_class = BatterySerializer
    permission_classes = [permissions.AllowAny]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        return (
            Battery.objects.select_related("battery_type")
            .prefetch_related("questionnaires__questionnaire_type")
            .all()
        )

    def create(self, request, *args, **kwargs):
        battery_type_id = request.data.get("battery_type") or request.data.get(
            "batteryType"
        )
        name = request.data.get("name", "")
        battery_type = get_object_or_404(BatteryType, pk=battery_type_id)
        battery = create_battery(battery_type, name)
        battery.refresh_from_db()
        serializer = self.get_serializer(battery)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path=r"by-token/(?P<share_token>[^/.]+)")
    def by_token(self, request, share_token=None):
        instance = get_object_or_404(
            Battery.objects.select_related("battery_type").prefetch_related(
                "questionnaires__questionnaire_type"
            ),
            share_token=share_token,
        )
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

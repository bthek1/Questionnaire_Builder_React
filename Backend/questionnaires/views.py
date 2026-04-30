import re
from datetime import date

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import QuestionnaireType, Questionnaire
from .pdf import generate_response_pdf
from .serializers import QuestionnaireSerializer, QuestionnaireTypeSerializer


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
        instance.answers = request.data.get("answers", {})
        instance.submitted_at = timezone.now()
        instance.save(update_fields=["answers", "submitted_at", "updated_at"])
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

        safe_title = re.sub(r"[^A-Za-z0-9_-]", "-", instance.questionnaire_type.title)[:60]
        filename = f"{safe_title}-{date.today().isoformat()}.pdf"
        http_response = HttpResponse(pdf_bytes, content_type="application/pdf")
        http_response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return http_response

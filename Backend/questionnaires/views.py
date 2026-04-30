import re
from datetime import date

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, viewsets
from rest_framework.views import APIView

from .models import Questionnaire, QuestionnaireResponse
from .pdf import generate_response_pdf
from .serializers import QuestionnaireResponseSerializer, QuestionnaireSerializer


class QuestionnaireViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionnaireSerializer
    permission_classes = [permissions.AllowAny]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return Questionnaire.objects.all()


class ResponseListCreateView(generics.ListCreateAPIView):
    serializer_class = QuestionnaireResponseSerializer

    def get_permissions(self):
        return [permissions.AllowAny()]

    def get_queryset(self):
        return QuestionnaireResponse.objects.filter(
            questionnaire_id=self.kwargs["questionnaire_pk"]
        )

    def perform_create(self, serializer):
        serializer.save(questionnaire_id=self.kwargs["questionnaire_pk"])


class ResponsePdfView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, questionnaire_pk, response_pk):
        questionnaire = get_object_or_404(Questionnaire, pk=questionnaire_pk)
        response_obj = get_object_or_404(
            QuestionnaireResponse,
            pk=response_pk,
            questionnaire=questionnaire,
        )

        try:
            pdf_bytes = generate_response_pdf(questionnaire, response_obj)
        except ValueError as exc:
            return HttpResponse(str(exc), status=400)

        safe_title = re.sub(r"[^A-Za-z0-9_-]", "-", questionnaire.title)[:60]
        filename = f"{safe_title}-{date.today().isoformat()}.pdf"

        http_response = HttpResponse(pdf_bytes, content_type="application/pdf")
        http_response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return http_response

import re

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from rest_framework import generics, permissions, viewsets
from rest_framework.views import APIView

import weasyprint

from .models import Questionnaire, QuestionnaireResponse
from .serializers import QuestionnaireResponseSerializer, QuestionnaireSerializer


def _resolve_questions(survey_json: dict, answers: dict) -> list[dict]:
    """Return a flat list of {name, title, display_value} from survey_json + answers."""
    questions = []
    for page in survey_json.get("pages", []):
        for element in page.get("elements", []):
            name = element.get("name", "")
            title = element.get("title") or name
            raw = answers.get(name)

            # Resolve choice labels for radio/dropdown/checkbox questions
            choices = element.get("choices", [])
            if choices and raw is not None:
                label_map: dict[str, str] = {}
                for c in choices:
                    if isinstance(c, dict):
                        label_map[str(c.get("value", ""))] = str(c.get("text", c.get("value", "")))
                    else:
                        label_map[str(c)] = str(c)

                if isinstance(raw, list):
                    display = ", ".join(label_map.get(str(v), str(v)) for v in raw)
                else:
                    display = label_map.get(str(raw), str(raw))
            elif raw is None:
                display = ""
            elif isinstance(raw, list):
                display = ", ".join(str(v) for v in raw)
            else:
                display = str(raw)

            questions.append({"name": name, "title": title, "display_value": display})
    return questions


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

        survey_json = questionnaire.survey_json or {}
        if not survey_json:
            return HttpResponse("survey_json is empty", status=400)

        answers = response_obj.answers if isinstance(response_obj.answers, dict) else {}
        questions = _resolve_questions(survey_json, answers)

        html_string = render_to_string(
            "questionnaires/response_pdf.html",
            {
                "questionnaire": questionnaire,
                "response": response_obj,
                "questions": questions,
            },
        )

        pdf_bytes = weasyprint.HTML(string=html_string).write_pdf()

        safe_title = re.sub(r"[^A-Za-z0-9_-]", "-", questionnaire.title)[:60]
        filename = f"{safe_title}-response.pdf"

        http_response = HttpResponse(pdf_bytes, content_type="application/pdf")
        http_response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return http_response

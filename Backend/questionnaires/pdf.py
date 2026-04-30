"""PDF generation utilities for questionnaire responses."""

from __future__ import annotations

from django.template.loader import render_to_string

import weasyprint

from .models import Questionnaire, QuestionnaireResponse


def _resolve_questions(survey_json: dict, answers: dict) -> list[dict]:
    """Return a flat list of {name, title, display_value} from survey_json + answers."""
    questions: list[dict] = []
    for page in survey_json.get("pages", []):
        for element in page.get("elements", []):
            name = element.get("name", "")
            title = element.get("title") or name
            raw = answers.get(name)

            choices = element.get("choices", [])
            if choices and raw is not None:
                label_map: dict[str, str] = {}
                for c in choices:
                    if isinstance(c, dict):
                        label_map[str(c.get("value", ""))] = str(
                            c.get("text", c.get("value", ""))
                        )
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


def generate_response_pdf(
    questionnaire: Questionnaire,
    response: QuestionnaireResponse,
) -> bytes:
    """Render *response* for *questionnaire* as PDF bytes.

    Raises ValueError if survey_json is empty.
    Returns PDF bytes (non-empty on success).
    """
    survey_json = questionnaire.survey_json or {}
    if not survey_json:
        raise ValueError("survey_json is empty — cannot generate PDF")

    answers = response.answers if isinstance(response.answers, dict) else {}
    questions = _resolve_questions(survey_json, answers)

    html_string = render_to_string(
        "questionnaires/response_pdf.html",
        {
            "questionnaire": questionnaire,
            "response": response,
            "questions": questions,
        },
    )

    return weasyprint.HTML(string=html_string).write_pdf()

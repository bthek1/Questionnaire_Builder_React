"""PDF generation utilities for questionnaire responses."""

from __future__ import annotations

from django.template.loader import render_to_string

import weasyprint

from .models import Questionnaire, QuestionnaireResponse


def _build_label_map(choices: list) -> dict[str, str]:
    """Return {value: display_text} from a SurveyJS choices list."""
    label_map: dict[str, str] = {}
    for c in choices:
        if isinstance(c, dict):
            label_map[str(c.get("value", ""))] = str(c.get("text", c.get("value", "")))
        else:
            label_map[str(c)] = str(c)
    return label_map


def _resolve_questions(survey_json: dict, answers: dict) -> list[dict]:
    """Return a flat list of question dicts from survey_json + answers.

    Each dict has at minimum: name, title.
    Plain questions also have display_value.
    Matrix questions have type="matrix", columns, and rows (each row has a selected_value).
    """
    questions: list[dict] = []
    for page in survey_json.get("pages", []):
        for element in page.get("elements", []):
            name = element.get("name", "")
            title = element.get("title") or name
            raw = answers.get(name)
            q_type = element.get("type", "")

            if q_type == "matrix":
                col_map = _build_label_map(element.get("columns", []))
                row_map = _build_label_map(element.get("rows", []))
                columns = list(col_map.values())
                row_answers = raw if isinstance(raw, dict) else {}
                rows = []
                for row_val, row_label in row_map.items():
                    selected_raw = row_answers.get(row_val)
                    selected_label = (
                        col_map.get(str(selected_raw), str(selected_raw))
                        if selected_raw is not None
                        else None
                    )
                    rows.append(
                        {
                            "label": row_label,
                            "selected": selected_label,
                            "columns": columns,
                        }
                    )
                questions.append(
                    {
                        "name": name,
                        "title": title,
                        "type": "matrix",
                        "columns": columns,
                        "rows": rows,
                        "display_value": "",
                    }
                )
            else:
                choices = element.get("choices", [])
                if choices and raw is not None:
                    label_map = _build_label_map(choices)
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

                questions.append(
                    {"name": name, "title": title, "type": q_type, "display_value": display}
                )
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

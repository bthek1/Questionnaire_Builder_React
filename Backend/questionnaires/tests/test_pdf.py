import pytest
from django.template.loader import render_to_string

from questionnaires.models import QuestionnaireType, Questionnaire
from questionnaires.pdf import _resolve_questions, generate_response_pdf


@pytest.mark.django_db
class TestResponsePdfTemplate:
    """Phase 2: verify the HTML template renders correctly."""

    def test_template_contains_questionnaire_title(self, questionnaire, response_for):
        questions = _resolve_questions(
            questionnaire.survey_json,
            response_for.answers if isinstance(response_for.answers, dict) else {},
        )
        html = render_to_string(
            "questionnaires/response_pdf.html",
            {
                "questionnaire": questionnaire,
                "response": response_for,
                "questions": questions,
            },
        )
        assert questionnaire.title in html

    def test_template_contains_question_title(self, questionnaire, response_for):
        questions = _resolve_questions(
            questionnaire.survey_json,
            response_for.answers if isinstance(response_for.answers, dict) else {},
        )
        html = render_to_string(
            "questionnaires/response_pdf.html",
            {
                "questionnaire": questionnaire,
                "response": response_for,
                "questions": questions,
            },
        )
        assert "Question 1" in html

    def test_empty_answer_renders_dash(self, db):
        q = QuestionnaireType.objects.create(
            title="Dash Test",
            survey_json={
                "pages": [{"elements": [{"type": "text", "name": "q1", "title": "Q1"}]}]
            },
        )
        r = Questionnaire.objects.create(questionnaire_type=q, answers={})
        questions = _resolve_questions(q.survey_json, {})
        html = render_to_string(
            "questionnaires/response_pdf.html",
            {"questionnaire": q, "response": r, "questions": questions},
        )
        assert "—" in html


@pytest.mark.django_db
class TestGenerateResponsePdf:
    def test_returns_bytes(self, questionnaire, response_for):
        result = generate_response_pdf(questionnaire, response_for)
        assert isinstance(result, bytes)

    def test_non_empty(self, questionnaire, response_for):
        result = generate_response_pdf(questionnaire, response_for)
        assert len(result) > 100

    def test_raises_on_empty_survey_json(self, db):
        q = QuestionnaireType.objects.create(title="Empty", survey_json={})
        r = Questionnaire.objects.create(questionnaire_type=q, answers={})
        with pytest.raises(ValueError, match="survey_json is empty"):
            generate_response_pdf(q, r)

    def test_empty_answers_do_not_raise(self, db):
        q = QuestionnaireType.objects.create(
            title="Survey",
            survey_json={
                "pages": [{"elements": [{"type": "text", "name": "q1", "title": "Q1"}]}]
            },
        )
        r = Questionnaire.objects.create(questionnaire_type=q, answers={})
        result = generate_response_pdf(q, r)
        assert isinstance(result, bytes)


class TestResolveQuestions:
    def _survey(self, elements):
        return {"pages": [{"elements": elements}]}

    def test_basic_text(self):
        survey = self._survey([{"type": "text", "name": "q1", "title": "Name"}])
        result = _resolve_questions(survey, {"q1": "Alice"})
        assert result == [
            {"name": "q1", "title": "Name", "type": "text", "display_value": "Alice"}
        ]

    def test_missing_answer_gives_empty_string(self):
        survey = self._survey([{"type": "text", "name": "q1", "title": "Q1"}])
        result = _resolve_questions(survey, {})
        assert result[0]["display_value"] == ""

    def test_radio_resolves_label(self):
        survey = self._survey(
            [
                {
                    "type": "radiogroup",
                    "name": "mood",
                    "title": "Mood",
                    "choices": [
                        {"value": "1", "text": "Good"},
                        {"value": "2", "text": "Bad"},
                    ],
                }
            ]
        )
        result = _resolve_questions(survey, {"mood": "1"})
        assert result[0]["display_value"] == "Good"

    def test_checkbox_multi_select_comma_separated(self):
        survey = self._survey(
            [
                {
                    "type": "checkbox",
                    "name": "symptoms",
                    "title": "Symptoms",
                    "choices": [
                        {"value": "a", "text": "Fatigue"},
                        {"value": "b", "text": "Pain"},
                        {"value": "c", "text": "Nausea"},
                    ],
                }
            ]
        )
        result = _resolve_questions(survey, {"symptoms": ["a", "c"]})
        assert result[0]["display_value"] == "Fatigue, Nausea"

    def test_list_answer_without_choices_comma_separated(self):
        survey = self._survey([{"type": "text", "name": "tags", "title": "Tags"}])
        result = _resolve_questions(survey, {"tags": ["x", "y"]})
        assert result[0]["display_value"] == "x, y"

    def test_empty_pages_returns_empty_list(self):
        result = _resolve_questions({"pages": []}, {})
        assert result == []

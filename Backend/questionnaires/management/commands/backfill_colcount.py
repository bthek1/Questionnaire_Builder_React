"""
Management command: backfill_colcount
--------------------------------------
Adds "colCount": -1 to every radiogroup and checkbox question inside
QuestionnaireType.survey_json and Questionnaire.survey_json_snapshot
that does not already have a colCount set.

Usage:
    python manage.py backfill_colcount
    python manage.py backfill_colcount --dry-run
"""

from __future__ import annotations

from django.core.management.base import BaseCommand

from questionnaires.models import Questionnaire, QuestionnaireType

CHOICE_TYPES = {"radiogroup", "checkbox"}


def _patch_elements(elements: list) -> bool:
    """Recursively patch elements in-place. Returns True if any change was made."""
    changed = False
    for el in elements:
        if not isinstance(el, dict):
            continue
        q_type = el.get("type", "")
        if q_type in CHOICE_TYPES and el.get("colCount") in (None, -1):
            el["colCount"] = 0
            changed = True
        # Recurse into panels
        for key in ("elements", "templateElements"):
            nested = el.get(key)
            if isinstance(nested, list) and _patch_elements(nested):
                changed = True
    return changed


def _patch_survey_json(survey_json: dict) -> bool:
    """Patch a survey JSON dict in-place. Returns True if any change was made."""
    if not isinstance(survey_json, dict):
        return False
    changed = False
    # Paged format
    pages = survey_json.get("pages")
    if isinstance(pages, list):
        for page in pages:
            elements = page.get("elements") if isinstance(page, dict) else None
            if isinstance(elements, list) and _patch_elements(elements):
                changed = True
    # Flat format
    elements = survey_json.get("elements")
    if isinstance(elements, list) and _patch_elements(elements):
        changed = True
    return changed


class Command(BaseCommand):
    help = (
        "Backfill colCount: -1 onto radiogroup/checkbox questions in survey_json fields"
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be changed without saving",
        )

    def handle(self, *_args, **options):
        dry_run: bool = options["dry_run"]
        prefix = "[DRY RUN] " if dry_run else ""

        # --- QuestionnaireType.survey_json ---
        qt_updated = 0
        for qt in QuestionnaireType.objects.all():
            if _patch_survey_json(qt.survey_json):
                qt_updated += 1
                self.stdout.write(
                    f"{prefix}QuestionnaireType {qt.id} ({qt.title!r}) patched"
                )
                if not dry_run:
                    qt.save(update_fields=["survey_json"])

        # --- Questionnaire.survey_json_snapshot (submitted only) ---
        q_updated = 0
        for q in Questionnaire.objects.exclude(survey_json_snapshot={}):
            if _patch_survey_json(q.survey_json_snapshot):
                q_updated += 1
                self.stdout.write(f"{prefix}Questionnaire {q.id} snapshot patched")
                if not dry_run:
                    q.save(update_fields=["survey_json_snapshot"])

        self.stdout.write(
            self.style.SUCCESS(
                f"{prefix}Done. "
                f"QuestionnaireTypes patched: {qt_updated}, "
                f"Questionnaire snapshots patched: {q_updated}"
            )
        )

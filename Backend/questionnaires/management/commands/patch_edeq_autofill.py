"""Management command: add defaultValueExpression to all integer/number input
questions in the EDE-Q QuestionnaireType so the take page can pre-fill them
from the respondent's most recent submission.

Usage:
    python manage.py patch_edeq_autofill            # apply changes
    python manage.py patch_edeq_autofill --dry-run  # print diff, no save
"""

import json
import copy
from django.core.management.base import BaseCommand
from questionnaires.models import QuestionnaireType


def _patch_elements(elements: list, changed: list[str]) -> list:
    """Recursively walk question elements and add defaultValueExpression to
    any 'text' question whose inputType is 'integer' or 'number'."""
    patched = []
    for element in elements:
        el = copy.deepcopy(element)
        # Recurse into panels
        if el.get("type") in ("panel", "paneldynamic"):
            sub_key = "elements" if el.get("type") == "panel" else "templateElements"
            if sub_key in el:
                el[sub_key] = _patch_elements(el[sub_key], changed)
        elif el.get("type") == "text" and el.get("inputType") in ("integer", "number"):
            name = el.get("name", "")
            expr = f"{{prior_{name}}}"
            if el.get("defaultValueExpression") != expr:
                el["defaultValueExpression"] = expr
                changed.append(name)
        patched.append(el)
    return patched


class Command(BaseCommand):
    help = "Add defaultValueExpression to EDE-Q integer questions for autofill."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Print what would change without saving.",
        )
        parser.add_argument(
            "--title-contains",
            default="EDE",
            help="Case-insensitive substring to identify the questionnaire type (default: 'EDE').",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        title_fragment = options["title_contains"]

        qs = QuestionnaireType.objects.filter(title__icontains=title_fragment)
        if not qs.exists():
            self.stderr.write(
                self.style.ERROR(
                    f"No QuestionnaireType found with title containing '{title_fragment}'."
                )
            )
            return

        for qt in qs:
            self.stdout.write(f"\nProcessing: {qt.title} ({qt.pk})")
            survey_json = qt.survey_json or {}

            changed: list[str] = []
            new_json = copy.deepcopy(survey_json)

            pages = new_json.get("pages")
            if pages:
                for page in pages:
                    if "elements" in page:
                        page["elements"] = _patch_elements(page["elements"], changed)
            elif "elements" in new_json:
                new_json["elements"] = _patch_elements(new_json["elements"], changed)

            if not changed:
                self.stdout.write(
                    self.style.WARNING("  No integer/number text questions found — nothing to patch.")
                )
                continue

            self.stdout.write(f"  Questions to patch ({len(changed)}): {', '.join(changed)}")

            if dry_run:
                self.stdout.write(
                    self.style.NOTICE("  [dry-run] Would save the following survey_json:")
                )
                self.stdout.write(json.dumps(new_json, indent=2)[:2000])
            else:
                qt.survey_json = new_json
                qt.save(update_fields=["survey_json", "updated_at"])
                self.stdout.write(
                    self.style.SUCCESS(f"  Saved. Patched {len(changed)} question(s).")
                )

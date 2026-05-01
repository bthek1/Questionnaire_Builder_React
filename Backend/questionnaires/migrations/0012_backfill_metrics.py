from django.db import migrations


def backfill_metrics(apps, schema_editor):
    """
    For each submitted Questionnaire, derive metrics from the answers
    that correspond to calculatedValues names defined in survey_json_snapshot.
    Only values already stored in answers (via includeIntoResult: true) can be
    backfilled; unevaluated expressions are skipped.
    """
    Questionnaire = apps.get_model("questionnaires", "Questionnaire")
    to_update = []
    for instance in Questionnaire.objects.filter(submitted_at__isnull=False):
        snapshot = instance.survey_json_snapshot or {}
        calc_defs = snapshot.get("calculatedValues", [])
        if not calc_defs:
            continue
        calc_names = {d["name"] for d in calc_defs if isinstance(d, dict) and "name" in d}
        answers = instance.answers or {}
        metrics = {name: answers[name] for name in calc_names if name in answers}
        if metrics:
            instance.metrics = metrics
            to_update.append(instance)
    if to_update:
        Questionnaire.objects.bulk_update(to_update, ["metrics"])


class Migration(migrations.Migration):

    dependencies = [
        ("questionnaires", "0011_questionnaire_metrics"),
    ]

    operations = [
        migrations.RunPython(backfill_metrics, migrations.RunPython.noop),
    ]

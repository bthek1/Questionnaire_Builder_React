from django.db import migrations


def backfill_snapshot(apps, schema_editor):
    Questionnaire = apps.get_model("questionnaires", "Questionnaire")
    to_update = []
    for instance in Questionnaire.objects.filter(submitted_at__isnull=False).select_related(
        "questionnaire_type"
    ):
        instance.survey_json_snapshot = instance.questionnaire_type.survey_json or {}
        to_update.append(instance)
    if to_update:
        Questionnaire.objects.bulk_update(to_update, ["survey_json_snapshot"])


class Migration(migrations.Migration):

    dependencies = [
        ("questionnaires", "0009_questionnaire_survey_json_snapshot"),
    ]

    operations = [
        migrations.RunPython(backfill_snapshot, migrations.RunPython.noop),
    ]

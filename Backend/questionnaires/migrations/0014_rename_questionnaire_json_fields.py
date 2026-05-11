from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("questionnaires", "0013_battery_models"),
    ]

    operations = [
        migrations.RenameField(
            model_name="questionnaire",
            old_name="answers",
            new_name="answers_json",
        ),
        migrations.RenameField(
            model_name="questionnaire",
            old_name="survey_json_snapshot",
            new_name="questionnaire_json_snapshot",
        ),
        migrations.RenameField(
            model_name="questionnaire",
            old_name="metrics",
            new_name="metrics_json",
        ),
    ]

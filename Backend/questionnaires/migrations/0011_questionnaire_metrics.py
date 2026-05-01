from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("questionnaires", "0010_backfill_survey_json_snapshot"),
    ]

    operations = [
        migrations.AddField(
            model_name="questionnaire",
            name="metrics",
            field=models.JSONField(blank=True, default=dict),
        ),
    ]

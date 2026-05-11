from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("questionnaires", "0014_rename_questionnaire_json_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="questionnairetype",
            name="recipient_json",
            field=models.JSONField(blank=True, default=None, null=True),
        ),
    ]

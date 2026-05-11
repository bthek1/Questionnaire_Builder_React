from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("questionnaires", "0015_questionnairetype_recipient_json"),
    ]

    operations = [
        migrations.RenameField(
            model_name="questionnairetype",
            old_name="survey_json",
            new_name="questionnaire_json",
        ),
        migrations.RemoveField(
            model_name="questionnairetype",
            name="description",
        ),
    ]

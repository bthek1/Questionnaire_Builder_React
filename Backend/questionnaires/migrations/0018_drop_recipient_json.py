from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("questionnaires", "0017_merge_recipient_json_into_questionnaire_json"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="questionnairetype",
            name="recipient_json",
        ),
    ]

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("questionnaires", "0005_rename_questionnaire_to_type"),
    ]

    operations = [
        migrations.RenameModel(
            old_name="QuestionnaireResponse",
            new_name="Questionnaire",
        ),
    ]

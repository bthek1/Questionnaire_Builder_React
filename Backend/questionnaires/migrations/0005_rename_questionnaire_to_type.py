from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("questionnaires", "0004_remove_questions_field"),
    ]

    operations = [
        # Rename the model (also renames the DB table atomically)
        migrations.RenameModel(
            old_name="Questionnaire",
            new_name="QuestionnaireType",
        ),
        # Rename the FK field on QuestionnaireResponse
        migrations.RenameField(
            model_name="questionnaireresponse",
            old_name="questionnaire",
            new_name="questionnaire_type",
        ),
    ]

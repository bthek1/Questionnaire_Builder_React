import uuid

import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


def populate_share_tokens(apps, schema_editor):
    Questionnaire = apps.get_model("questionnaires", "Questionnaire")
    for obj in Questionnaire.objects.all():
        obj.share_token = uuid.uuid4()
        obj.save(update_fields=["share_token"])


class Migration(migrations.Migration):

    dependencies = [
        ("questionnaires", "0006_rename_response_to_questionnaire"),
    ]

    operations = [
        migrations.AddField(
            model_name="questionnaire",
            name="name",
            field=models.CharField(blank=True, max_length=255, default=""),
            preserve_default=False,
        ),
        # Add share_token WITHOUT unique constraint first so existing rows can be populated
        migrations.AddField(
            model_name="questionnaire",
            name="share_token",
            field=models.UUIDField(default=uuid.uuid4, db_index=True),
        ),
        # Back-fill unique tokens for any existing rows
        migrations.RunPython(populate_share_tokens, migrations.RunPython.noop),
        # Now add the unique constraint
        migrations.AlterField(
            model_name="questionnaire",
            name="share_token",
            field=models.UUIDField(default=uuid.uuid4, unique=True, db_index=True),
        ),
        migrations.AddField(
            model_name="questionnaire",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="questionnaire",
            name="updated_at",
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AlterField(
            model_name="questionnaire",
            name="answers",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AlterField(
            model_name="questionnaire",
            name="submitted_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="questionnaire",
            name="questionnaire_type",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="instances",
                to="questionnaires.questionnairetype",
            ),
        ),
    ]

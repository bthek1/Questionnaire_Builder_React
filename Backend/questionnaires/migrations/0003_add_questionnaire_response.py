import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('questionnaires', '0002_owner_nullable'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                # Rename the table that was previously owned by the responses app.
                migrations.RunSQL(
                    sql='ALTER TABLE responses_questionnaireresponse RENAME TO questionnaires_questionnaireresponse;',
                    reverse_sql='ALTER TABLE questionnaires_questionnaireresponse RENAME TO responses_questionnaireresponse;',
                ),
                # Remove stale migration history for the now-deleted responses app.
                migrations.RunSQL(
                    sql="DELETE FROM django_migrations WHERE app = 'responses';",
                    reverse_sql=migrations.RunSQL.noop,
                ),
            ],
            state_operations=[
                migrations.CreateModel(
                    name='QuestionnaireResponse',
                    fields=[
                        ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                        ('answers', models.JSONField(default=list)),
                        ('submitted_at', models.DateTimeField(auto_now_add=True)),
                        ('questionnaire', models.ForeignKey(
                            on_delete=django.db.models.deletion.CASCADE,
                            related_name='responses',
                            to='questionnaires.questionnaire',
                        )),
                    ],
                ),
            ],
        ),
    ]

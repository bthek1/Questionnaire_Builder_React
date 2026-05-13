from django.db import migrations


def merge_recipient_json(apps, schema_editor):
    QuestionnaireType = apps.get_model("questionnaires", "QuestionnaireType")
    for qt in QuestionnaireType.objects.exclude(recipient_json=None):
        rj = qt.recipient_json
        # Normalise to a page descriptor if it is a bare element object
        if not isinstance(rj, dict) or "elements" not in rj:
            rj = {"name": "recipient_page", "elements": [rj]}
        qj = qt.questionnaire_json or {}
        if "pages" in qj and isinstance(qj.get("pages"), list):
            qj = {**qj, "pages": [rj, *qj["pages"]]}
        elif "elements" in qj and isinstance(qj.get("elements"), list):
            qj = {"pages": [rj, {"name": "page1", "elements": qj["elements"]}]}
        else:
            qj = {**qj, "pages": [rj]}
        qt.questionnaire_json = qj
        qt.save(update_fields=["questionnaire_json"])


def reverse_merge_recipient_json(apps, schema_editor):
    # Extract recipient_page back out of questionnaire_json.pages[0] where applicable.
    QuestionnaireType = apps.get_model("questionnaires", "QuestionnaireType")
    for qt in QuestionnaireType.objects.all():
        qj = qt.questionnaire_json or {}
        pages = qj.get("pages") if isinstance(qj, dict) else None
        if not isinstance(pages, list) or not pages:
            continue
        first = pages[0]
        if not isinstance(first, dict) or first.get("name") != "recipient_page":
            continue
        qt.recipient_json = first
        qt.questionnaire_json = {**qj, "pages": pages[1:]}
        qt.save(update_fields=["questionnaire_json", "recipient_json"])


class Migration(migrations.Migration):

    dependencies = [
        ("questionnaires", "0016_questionnairetype_rename_survey_json_remove_description"),
    ]

    operations = [
        migrations.RunPython(
            merge_recipient_json,
            reverse_code=reverse_merge_recipient_json,
        ),
    ]

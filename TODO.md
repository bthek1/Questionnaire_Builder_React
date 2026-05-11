# TODO



```
create a md to plan to implement:


some questionnaire need to record recipient information like:
{
  "name": "recipient_page",
  "elements": [
    {
      "name": "recipient__respondent_type",
      "type": "radiogroup",
      "title": "Who is completing this questionnaire?",
      "choices": [
        {
          "text": "I am completing this questionnaire for myself",
          "value": "myself"
        },
        {
          "text": "I am the mother completing this questionnaire for my child",
          "value": "mother"
        },
        {
          "text": "I am the father completing this questionnaire for my child",
          "value": "father"
        },
        {
          "text": "I am the guardian completing this questionnaire for my child",
          "value": "guardian"
        },
        {
          "text": "I am a practitioner completing this questionnaire on behalf of a client/patient",
          "value": "practitioner"
        },
        {
          "text": "Other",
          "value": "other"
        }
      ],
      "isRequired": true
    }
  ]
}



I want to add recipient_json to questionnaire_type model


then when rendering the questionnaire to clients, also show recipient_json before the first questions


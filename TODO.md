# TODO



```
create a md to plan to implement:


some questionnaire need to record recipient information like:{
  "type": "radiogroup",
  "name": "respondent_type",
  "title": "Who is completing this questionnaire?",
  "isRequired": true,
  "choices": [
    { "value": "myself", "text": "I am completing this questionnaire for myself" },
    { "value": "mother", "text": "I am the mother completing this questionnaire for my child" },
    { "value": "father", "text": "I am the father completing this questionnaire for my child" },
    { "value": "guardian", "text": "I am the guardian completing this questionnaire for my child" },
    { "value": "practitioner", "text": "I am a practitioner completing this questionnaire on behalf of a client/patient" },
    { "value": "other", "text": "Other" }
  ]
}



I want to add recipient_json to questionnaire_type model


then when rendering the questionnaire to clients, also show recipient_json before the first questions


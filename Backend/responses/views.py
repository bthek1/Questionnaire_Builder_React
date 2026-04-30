from rest_framework import generics, permissions

from .models import QuestionnaireResponse
from .serializers import QuestionnaireResponseSerializer


class ResponseListCreateView(generics.ListCreateAPIView):
    serializer_class = QuestionnaireResponseSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        return QuestionnaireResponse.objects.filter(
            questionnaire_id=self.kwargs['questionnaire_pk']
        )

    def perform_create(self, serializer):
        serializer.save(questionnaire_id=self.kwargs['questionnaire_pk'])

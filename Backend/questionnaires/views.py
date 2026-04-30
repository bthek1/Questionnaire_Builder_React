from rest_framework import generics, permissions, viewsets

from .models import Questionnaire, QuestionnaireResponse
from .serializers import QuestionnaireResponseSerializer, QuestionnaireSerializer


class QuestionnaireViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionnaireSerializer
    permission_classes = [permissions.AllowAny]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return Questionnaire.objects.all()


class ResponseListCreateView(generics.ListCreateAPIView):
    serializer_class = QuestionnaireResponseSerializer

    def get_permissions(self):
        return [permissions.AllowAny()]

    def get_queryset(self):
        return QuestionnaireResponse.objects.filter(
            questionnaire_id=self.kwargs["questionnaire_pk"]
        )

    def perform_create(self, serializer):
        serializer.save(questionnaire_id=self.kwargs["questionnaire_pk"])

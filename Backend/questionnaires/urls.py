from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import QuestionnaireTypeViewSet, QuestionnaireViewSet

router = DefaultRouter()
router.register("questionnaire-types", QuestionnaireTypeViewSet, basename="questionnaire-type")
router.register("questionnaires", QuestionnaireViewSet, basename="questionnaire")

urlpatterns = [
    path("", include(router.urls)),
]

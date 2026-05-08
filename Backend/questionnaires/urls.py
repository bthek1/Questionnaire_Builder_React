from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    BatteryTypeViewSet,
    BatteryViewSet,
    QuestionnaireTypeViewSet,
    QuestionnaireViewSet,
)

router = DefaultRouter()
router.register(
    "questionnaire-types", QuestionnaireTypeViewSet, basename="questionnaire-type"
)
router.register("questionnaires", QuestionnaireViewSet, basename="questionnaire")
router.register("battery-types", BatteryTypeViewSet, basename="battery-type")
router.register("batteries", BatteryViewSet, basename="battery")

urlpatterns = [
    path("", include(router.urls)),
]

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import QuestionnaireViewSet

router = DefaultRouter()
router.register('', QuestionnaireViewSet, basename='questionnaire')

urlpatterns = [
    path('', include(router.urls)),
]

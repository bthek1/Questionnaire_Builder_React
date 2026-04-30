from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import QuestionnaireTypeViewSet, ResponseListCreateView, ResponsePdfView

router = DefaultRouter()
router.register("", QuestionnaireTypeViewSet, basename="questionnaire")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "<uuid:questionnaire_pk>/responses/",
        ResponseListCreateView.as_view(),
        name="questionnaire-responses",
    ),
    path(
        "<uuid:questionnaire_pk>/responses/<uuid:response_pk>/pdf/",
        ResponsePdfView.as_view(),
        name="response-pdf",
    ),
]

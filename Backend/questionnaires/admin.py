from django.contrib import admin

from .models import QuestionnaireType, Questionnaire


@admin.register(QuestionnaireType)
class QuestionnaireTypeAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "created_at", "updated_at")
    list_filter = ("owner", "created_at")
    search_fields = ("title", "description", "owner__username")
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("-created_at",)


@admin.register(Questionnaire)
class QuestionnaireAdmin(admin.ModelAdmin):
    list_display = ("id", "questionnaire_type", "submitted_at")
    list_filter = ("questionnaire_type", "submitted_at")
    search_fields = ("questionnaire_type__title",)
    readonly_fields = ("id", "submitted_at")
    ordering = ("-submitted_at",)

from django.contrib import admin

from .models import Questionnaire, QuestionnaireResponse


@admin.register(Questionnaire)
class QuestionnaireAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'created_at', 'updated_at')
    list_filter = ('owner', 'created_at')
    search_fields = ('title', 'description', 'owner__username')
    readonly_fields = ('id', 'created_at', 'updated_at')
    ordering = ('-created_at',)


@admin.register(QuestionnaireResponse)
class QuestionnaireResponseAdmin(admin.ModelAdmin):
    list_display = ('id', 'questionnaire', 'submitted_at')
    list_filter = ('questionnaire', 'submitted_at')
    search_fields = ('questionnaire__title',)
    readonly_fields = ('id', 'submitted_at')
    ordering = ('-submitted_at',)

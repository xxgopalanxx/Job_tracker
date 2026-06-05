from django.contrib import admin
from .models import JobApplication, Interview, Tag, ApplicationTag


class InterviewInline(admin.TabularInline):
    model = Interview
    extra = 0
    fields = ['interview_type', 'scheduled_at', 'duration_minutes', 'interviewer_name', 'completed']


class ApplicationTagInline(admin.TabularInline):
    model = ApplicationTag
    extra = 0


@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ['company', 'position', 'status', 'work_type', 'user', 'applied_date', 'created_at']
    list_filter = ['status', 'work_type', 'job_type']
    search_fields = ['company', 'position', 'user__email']
    ordering = ['-created_at']
    inlines = [InterviewInline, ApplicationTagInline]
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Interview)
class InterviewAdmin(admin.ModelAdmin):
    list_display = ['application', 'interview_type', 'scheduled_at', 'completed']
    list_filter = ['interview_type', 'completed']
    search_fields = ['application__company', 'application__position']


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name', 'color', 'user']
    search_fields = ['name', 'user__email']

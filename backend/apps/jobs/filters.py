import django_filters
from .models import JobApplication


class JobApplicationFilter(django_filters.FilterSet):
    status = django_filters.MultipleChoiceFilter(choices=JobApplication.STATUS_CHOICES)
    work_type = django_filters.MultipleChoiceFilter(choices=JobApplication.WORK_TYPE_CHOICES)
    job_type = django_filters.MultipleChoiceFilter(choices=JobApplication.JOB_TYPE_CHOICES)
    applied_date_after = django_filters.DateFilter(field_name='applied_date', lookup_expr='gte')
    applied_date_before = django_filters.DateFilter(field_name='applied_date', lookup_expr='lte')
    salary_min = django_filters.NumberFilter(field_name='salary_min', lookup_expr='gte')
    salary_max = django_filters.NumberFilter(field_name='salary_max', lookup_expr='lte')

    class Meta:
        model = JobApplication
        fields = ['status', 'work_type', 'job_type', 'applied_date_after', 'applied_date_before']

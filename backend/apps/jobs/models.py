from django.db import models
from apps.accounts.models import User


class JobApplication(models.Model):
    STATUS_CHOICES = [
        ('wishlist', 'Wishlist'),
        ('applied', 'Applied'),
        ('phone_screen', 'Phone Screen'),
        ('interview', 'Interview'),
        ('technical', 'Technical Round'),
        ('offer', 'Offer'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
    ]

    WORK_TYPE_CHOICES = [
        ('remote', 'Remote'),
        ('hybrid', 'Hybrid'),
        ('onsite', 'On-site'),
    ]

    JOB_TYPE_CHOICES = [
        ('full_time', 'Full Time'),
        ('part_time', 'Part Time'),
        ('contract', 'Contract'),
        ('internship', 'Internship'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='applications')
    company = models.CharField(max_length=200)
    position = models.CharField(max_length=200)
    location = models.CharField(max_length=200, blank=True)
    job_url = models.URLField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='wishlist')
    work_type = models.CharField(max_length=10, choices=WORK_TYPE_CHOICES, default='remote')
    job_type = models.CharField(max_length=20, choices=JOB_TYPE_CHOICES, default='full_time')
    salary_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    salary_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    salary_currency = models.CharField(max_length=3, default='USD')
    description = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    applied_date = models.DateField(null=True, blank=True)
    deadline = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'job_applications'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.position} at {self.company} ({self.status})'


class Interview(models.Model):
    INTERVIEW_TYPE_CHOICES = [
        ('phone', 'Phone Screen'),
        ('video', 'Video Call'),
        ('onsite', 'On-site'),
        ('technical', 'Technical'),
        ('hr', 'HR Round'),
        ('final', 'Final Round'),
    ]

    application = models.ForeignKey(
        JobApplication, on_delete=models.CASCADE, related_name='interviews'
    )
    interview_type = models.CharField(max_length=20, choices=INTERVIEW_TYPE_CHOICES)
    scheduled_at = models.DateTimeField()
    duration_minutes = models.IntegerField(default=60)
    interviewer_name = models.CharField(max_length=100, blank=True)
    interviewer_role = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    feedback = models.TextField(blank=True)
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'interviews'
        ordering = ['scheduled_at']

    def __str__(self):
        return f'{self.interview_type} for {self.application}'


class Tag(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tags')
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default='#6366f1')

    class Meta:
        db_table = 'tags'
        unique_together = ['user', 'name']

    def __str__(self):
        return self.name


class ApplicationTag(models.Model):
    application = models.ForeignKey(JobApplication, on_delete=models.CASCADE, related_name='application_tags')
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)

    class Meta:
        db_table = 'application_tags'
        unique_together = ['application', 'tag']

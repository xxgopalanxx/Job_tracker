from rest_framework import serializers
from .models import JobApplication, Interview, Tag, ApplicationTag


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'color']
        read_only_fields = ['id']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class InterviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interview
        fields = [
            'id', 'application', 'interview_type', 'scheduled_at',
            'duration_minutes', 'interviewer_name', 'interviewer_role',
            'notes', 'feedback', 'completed', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class JobApplicationSerializer(serializers.ModelSerializer):
    interviews = InterviewSerializer(many=True, read_only=True)
    tags = serializers.SerializerMethodField()
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=Tag.objects.all(), required=False, source='tags_list'
    )
    interview_count = serializers.SerializerMethodField()

    class Meta:
        model = JobApplication
        fields = [
            'id', 'company', 'position', 'location', 'job_url',
            'status', 'work_type', 'job_type',
            'salary_min', 'salary_max', 'salary_currency',
            'description', 'notes', 'applied_date', 'deadline',
            'interviews', 'tags', 'tag_ids', 'interview_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_tags(self, obj):
        app_tags = obj.application_tags.select_related('tag').all()
        return TagSerializer([at.tag for at in app_tags], many=True).data

    def get_interview_count(self, obj):
        return obj.interviews.count()

    def create(self, validated_data):
        tags_list = validated_data.pop('tags_list', [])
        validated_data['user'] = self.context['request'].user
        application = super().create(validated_data)
        for tag in tags_list:
            ApplicationTag.objects.create(application=application, tag=tag)
        return application

    def update(self, instance, validated_data):
        tags_list = validated_data.pop('tags_list', None)
        application = super().update(instance, validated_data)
        if tags_list is not None:
            ApplicationTag.objects.filter(application=application).delete()
            for tag in tags_list:
                ApplicationTag.objects.create(application=application, tag=tag)
        return application


class JobApplicationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    tags = serializers.SerializerMethodField()
    interview_count = serializers.SerializerMethodField()

    class Meta:
        model = JobApplication
        fields = [
            'id', 'company', 'position', 'location',
            'status', 'work_type', 'job_type',
            'salary_min', 'salary_max', 'salary_currency',
            'applied_date', 'deadline', 'tags', 'interview_count',
            'created_at', 'updated_at'
        ]

    def get_tags(self, obj):
        app_tags = obj.application_tags.select_related('tag').all()
        return TagSerializer([at.tag for at in app_tags], many=True).data

    def get_interview_count(self, obj):
        return obj.interviews.count()


class DashboardStatsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    by_status = serializers.DictField()
    recent_activity = JobApplicationListSerializer(many=True)
    monthly_applications = serializers.ListField()
    response_rate = serializers.FloatField()
    offer_rate = serializers.FloatField()

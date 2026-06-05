from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta

from .models import JobApplication, Interview, Tag
from .serializers import (
    JobApplicationSerializer, JobApplicationListSerializer,
    InterviewSerializer, TagSerializer
)
from .filters import JobApplicationFilter


class JobApplicationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = JobApplicationFilter
    search_fields = ['company', 'position', 'location', 'notes']
    ordering_fields = ['created_at', 'updated_at', 'applied_date', 'company', 'position']
    ordering = ['-created_at']

    def get_queryset(self):
        return JobApplication.objects.filter(
            user=self.request.user
        ).prefetch_related('interviews', 'application_tags__tag')

    def get_serializer_class(self):
        if self.action == 'list':
            return JobApplicationListSerializer
        return JobApplicationSerializer

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        qs = self.get_queryset()
        total = qs.count()

        by_status = dict(
            qs.values('status').annotate(count=Count('id')).values_list('status', 'count')
        )

        # Fill missing statuses with 0
        all_statuses = [s[0] for s in JobApplication.STATUS_CHOICES]
        for s in all_statuses:
            by_status.setdefault(s, 0)

        # Monthly applications (last 6 months)
        six_months_ago = timezone.now() - timedelta(days=180)
        monthly = (
            qs.filter(created_at__gte=six_months_ago)
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )
        monthly_data = [
            {'month': m['month'].strftime('%b %Y'), 'count': m['count']}
            for m in monthly
        ]

        # Response rate (anything past applied)
        responded = qs.filter(
            status__in=['phone_screen', 'interview', 'technical', 'offer', 'rejected']
        ).count()
        applied = qs.filter(status='applied').count()
        response_rate = (responded / (responded + applied) * 100) if (responded + applied) > 0 else 0

        # Offer rate
        offers = by_status.get('offer', 0)
        offer_rate = (offers / total * 100) if total > 0 else 0

        recent = qs.order_by('-updated_at')[:5]

        return Response({
            'total': total,
            'by_status': by_status,
            'recent_activity': JobApplicationListSerializer(recent, many=True).data,
            'monthly_applications': monthly_data,
            'response_rate': round(response_rate, 1),
            'offer_rate': round(offer_rate, 1),
        })

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        application = self.get_object()
        new_status = request.data.get('status')
        valid = [s[0] for s in JobApplication.STATUS_CHOICES]
        if new_status not in valid:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        application.status = new_status
        application.save(update_fields=['status', 'updated_at'])
        return Response(JobApplicationSerializer(application, context={'request': request}).data)


class InterviewViewSet(viewsets.ModelViewSet):
    serializer_class = InterviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Interview.objects.filter(
            application__user=self.request.user
        ).select_related('application')

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        now = timezone.now()
        upcoming = self.get_queryset().filter(
            scheduled_at__gte=now, completed=False
        ).order_by('scheduled_at')[:10]
        return Response(InterviewSerializer(upcoming, many=True).data)


class TagViewSet(viewsets.ModelViewSet):
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Tag.objects.filter(user=self.request.user)

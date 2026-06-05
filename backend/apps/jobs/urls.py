from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JobApplicationViewSet, InterviewViewSet, TagViewSet

router = DefaultRouter()
router.register(r'applications', JobApplicationViewSet, basename='application')
router.register(r'interviews', InterviewViewSet, basename='interview')
router.register(r'tags', TagViewSet, basename='tag')

urlpatterns = [
    path('', include(router.urls)),
]

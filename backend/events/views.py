from rest_framework import generics
from rest_framework.permissions import AllowAny

from .models import Event
from .serializers import EventSerializer


class EventListAPIView(
    generics.ListAPIView
):

    serializer_class = EventSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Event.objects.filter(
            is_active=True
        )
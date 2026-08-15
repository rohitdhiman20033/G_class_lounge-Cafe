from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import (
    ContactInfo,
    ContactMessage,
)
from .serializers import (
    ContactInfoSerializer,
    ContactMessageSerializer,
)


class ContactInfoAPIView(
    generics.GenericAPIView
):
    permission_classes = [AllowAny]
    serializer_class = ContactInfoSerializer

    def get(self, request, *args, **kwargs):
        contact_info = (
            ContactInfo.objects
            .filter(is_active=True)
            .order_by("-updated_at")
            .first()
        )

        if not contact_info:
            return Response(
                {
                    "detail": (
                        "Contact information "
                        "is not available."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(
            contact_info
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class ContactMessageCreateAPIView(
    generics.CreateAPIView
):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [AllowAny]

    def create(
        self,
        request,
        *args,
        **kwargs,
    ):
        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        self.perform_create(serializer)

        return Response(
            {
                "message": (
                    "Your message has been "
                    "sent successfully."
                ),
                "contact_message":
                    serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )
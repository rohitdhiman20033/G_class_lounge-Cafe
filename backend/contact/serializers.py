from rest_framework import serializers

from .models import (
    ContactInfo,
    ContactMessage,
)


class ContactInfoSerializer(
    serializers.ModelSerializer
):

    class Meta:

        model = ContactInfo

        fields = (
            "id",
            "address",
            "phone",
            "email",
            "opening_hours",
            "google_map_url",
            "whatsapp_number",
            "instagram_url",
            "facebook_url",
            "youtube_url",
        )


class ContactMessageSerializer(
    serializers.ModelSerializer
):

    class Meta:

        model = ContactMessage

        fields = (
            "id",
            "name",
            "email",
            "phone",
            "subject",
            "message",
            "created_at",
        )

        read_only_fields = (
            "id",
            "created_at",
        )

    def validate_name(
        self,
        value,
    ):

        value = value.strip()

        if len(value) < 2:

            raise serializers.ValidationError(
                "Name must contain at least 2 characters."
            )

        return value

    def validate_subject(
        self,
        value,
    ):

        value = value.strip()

        if len(value) < 3:

            raise serializers.ValidationError(
                "Subject is too short."
            )

        return value

    def validate_message(
        self,
        value,
    ):

        value = value.strip()

        if len(value) < 10:

            raise serializers.ValidationError(
                "Message should contain at least 10 characters."
            )

        return value
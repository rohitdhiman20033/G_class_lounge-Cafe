from rest_framework import serializers

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    profile_image = serializers.SerializerMethodField()

    class Meta:
        model = Review

        fields = [
            "id",
            "user_name",
            "profile_image",
            "rating",
            "comment",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "user_name",
            "profile_image",
            "created_at",
        ]

    def get_user_name(self, obj):
        return (
            obj.user.get_full_name()
            or obj.user.username
            or obj.user.email
        )

    def get_profile_image(self, obj):
        profile = getattr(
            obj.user,
            "profile",
            None,
        )

        if not profile:
            return None

        image = getattr(
            profile,
            "profile_image",
            None,
        )

        if not image:
            return None

        try:
            image_url = image.url
        except (ValueError, AttributeError):
            return None

        request = self.context.get("request")

        if request:
            return request.build_absolute_uri(
                image_url
            )

        return image_url
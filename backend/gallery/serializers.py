from rest_framework import serializers

from .models import GalleryImage


class GalleryImageSerializer(serializers.ModelSerializer):

    image = serializers.SerializerMethodField()

    class Meta:
        model = GalleryImage

        fields = [
            "id",
            "title",
            "description",
            "image",
            "card_size",
        ]

    def get_image(self, obj):

        request = self.context.get("request")

        if obj.image:

            if request:
                return request.build_absolute_uri(
                    obj.image.url
                )

            return obj.image.url

        return None
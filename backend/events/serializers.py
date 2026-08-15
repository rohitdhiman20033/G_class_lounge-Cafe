from rest_framework import serializers

from .models import Event


class EventSerializer(serializers.ModelSerializer):

    image = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = "__all__"

    def get_image(self, obj):

        request = self.context.get("request")

        if obj.image:

            if request:
                return request.build_absolute_uri(
                    obj.image.url
                )

            return obj.image.url

        return None
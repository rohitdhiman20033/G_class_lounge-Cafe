from rest_framework import serializers

from .models import Wishlist
from menu.serializers import MenuItemSerializer


class WishlistSerializer(serializers.ModelSerializer):

    menu_item = MenuItemSerializer(
        read_only=True
    )

    menu_item_id = serializers.IntegerField(
        write_only=True
    )

    class Meta:
        model = Wishlist

        fields = [
            "id",
            "menu_item",
            "menu_item_id",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]

    def create(self, validated_data):

        user = self.context["request"].user

        menu_item_id = validated_data.pop(
            "menu_item_id"
        )

        wishlist_item, _ = Wishlist.objects.get_or_create(
            user=user,
            menu_item_id=menu_item_id,
        )

        return wishlist_item
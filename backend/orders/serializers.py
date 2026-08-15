from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from menu.models import MenuItem
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_id = serializers.IntegerField(
        write_only=True
    )

    class Meta:
        model = OrderItem

        fields = [
            "id",
            "menu_item",
            "menu_item_id",
            "item_name",
            "quantity",
            "price",
        ]

        read_only_fields = [
            "id",
            "menu_item",
            "item_name",
            "price",
        ]

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError(
                "Quantity must be at least 1."
            )

        return value


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(
        many=True
    )

    payment_status = serializers.SerializerMethodField()
    payment_provider = serializers.SerializerMethodField()

    refund_status = serializers.SerializerMethodField()
    refund_reason = serializers.SerializerMethodField()
    refunded_at = serializers.SerializerMethodField()

    class Meta:
        model = Order

        fields = [
            "id",
            "user",
            "customer_name",
            "phone",
            "total",
            "status",

            "payment_status",
            "payment_provider",

            "refund_status",
            "refund_reason",
            "refunded_at",

            "cancellation_reason",
            "cancelled_at",
            "created_at",
            "updated_at",
            "items",
        ]

        read_only_fields = [
            "id",
            "user",
            "total",

            "payment_status",
            "payment_provider",

            "refund_status",
            "refund_reason",
            "refunded_at",

            "cancellation_reason",
            "cancelled_at",
            "created_at",
            "updated_at",
        ]

    def get_payment_status(self, obj):
        try:
            return obj.payment.status
        except Exception:
            return "Unpaid"

    def get_payment_provider(self, obj):
        try:
            return obj.payment.provider
        except Exception:
            return None

    def get_refund_status(self, obj):
        try:
            return obj.payment.refund_status
        except Exception:
            return None

    def get_refund_reason(self, obj):
        try:
            return obj.payment.refund_reason
        except Exception:
            return ""

    def get_refunded_at(self, obj):
        try:
            return obj.payment.refunded_at
        except Exception:
            return None

    def validate_phone(self, value):
        phone = value.strip()

        if (
            len(phone) != 10
            or not phone.isdigit()
            or phone[0] not in "6789"
        ):
            raise serializers.ValidationError(
                "Enter a valid 10-digit mobile number."
            )

        return phone

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError(
                "Order must contain at least one item."
            )

        return value

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop(
            "items"
        )

        request = self.context.get(
            "request"
        )

        if (
            not request
            or not request.user.is_authenticated
        ):
            raise serializers.ValidationError(
                "Authentication is required."
            )

        quantities = {}

        for item in items_data:
            menu_item_id = item[
                "menu_item_id"
            ]

            quantity = item[
                "quantity"
            ]

            quantities[menu_item_id] = (
                quantities.get(
                    menu_item_id,
                    0
                )
                + quantity
            )

        menu_item_ids = sorted(
            quantities.keys()
        )

        menu_items = (
            MenuItem.objects
            .select_for_update()
            .filter(
                id__in=menu_item_ids
            )
        )

        menu_map = {
            item.id: item
            for item in menu_items
        }

        if (
            len(menu_map)
            != len(menu_item_ids)
        ):
            raise serializers.ValidationError(
                {
                    "items": (
                        "One or more menu items "
                        "do not exist."
                    )
                }
            )

        total = Decimal(
            "0.00"
        )

        prepared_items = []

        for menu_item_id in menu_item_ids:
            menu_item = menu_map[
                menu_item_id
            ]

            quantity = quantities[
                menu_item_id
            ]

            if not menu_item.available:
                raise serializers.ValidationError(
                    {
                        "items": (
                            f"{menu_item.name} "
                            "is unavailable."
                        )
                    }
                )

            if menu_item.stock < quantity:
                raise serializers.ValidationError(
                    {
                        "items": (
                            f"Only {menu_item.stock} "
                            f"{menu_item.name} "
                            "item(s) available."
                        )
                    }
                )

            total += (
                menu_item.price
                * quantity
            )

            prepared_items.append(
                {
                    "menu_item":
                        menu_item,

                    "item_name":
                        menu_item.name,

                    "quantity":
                        quantity,

                    "price":
                        menu_item.price,
                }
            )

        order = Order.objects.create(
            user=request.user,
            total=total,
            **validated_data
        )

        order_items = []

        for item in prepared_items:
            menu_item = item[
                "menu_item"
            ]

            menu_item.stock -= item[
                "quantity"
            ]

            menu_item.save(
                update_fields=[
                    "stock"
                ]
            )

            order_items.append(
                OrderItem(
                    order=order,
                    **item
                )
            )

        OrderItem.objects.bulk_create(
            order_items
        )

        return order
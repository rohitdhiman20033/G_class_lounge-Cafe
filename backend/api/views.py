from rest_framework import permissions, viewsets

from menu.models import MenuItem

from .serializers import MenuSerializer


class MenuViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.all()
    serializer_class = MenuSerializer

    permission_classes = [
        permissions.AllowAny
    ]
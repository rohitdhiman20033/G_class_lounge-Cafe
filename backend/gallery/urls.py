from django.urls import path

from .views import GalleryListAPIView

urlpatterns = [

    path(
        "",
        GalleryListAPIView.as_view(),
        name="gallery-list",
    ),

]
from django.urls import path

from .views import EventListAPIView

urlpatterns = [

    path(
        "",
        EventListAPIView.as_view(),
    ),

]
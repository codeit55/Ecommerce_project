from django.urls import path
from .views import CartView, CartItemCreateView, CartItemDetailView
urlpatterns = [
    path("", CartView.as_view()),
    path("items/", CartItemCreateView.as_view()),
    path("items/<int:pk>/", CartItemDetailView.as_view()),
]
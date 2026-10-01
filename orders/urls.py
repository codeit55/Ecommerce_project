from django.urls import path
from .views import OrderListView,OrderDetailView,CheckoutView,SellerOrderItemListView,SellerOrderItemUpdateView

urlpatterns = [
    path("", OrderListView.as_view()),
    path("<int:pk>/", OrderDetailView.as_view()),
    path("checkout/", CheckoutView.as_view()),
    path("seller/", SellerOrderItemListView.as_view()),
    path("seller/<int:pk>/", SellerOrderItemUpdateView.as_view()),
]
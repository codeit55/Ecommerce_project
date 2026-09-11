from rest_framework import permissions

class IsAdminOrSeller(permissions.BasePermission):
    def has_permission(self,request,view):
        return(request.user.is_authenticated and request.user.role == "SELLER" or request.user.is_staff)

    def has_object_permission(self,request,view,obj):
        if request.user.is_staff:
            return True

        return obj.seller == request.user

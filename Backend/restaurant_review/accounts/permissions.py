from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        # Check if the user is authenticated and has the role 'admin'
        return request.user.is_authenticated and getattr(request.user, 'role', None) == 'admin'

class IsBusinessOwner(BasePermission):
    def has_permission(self, request, view):
        # Check if the user is authenticated and has the role 'owner'
        return request.user.is_authenticated and getattr(request.user, 'role', None) == 'owner'

class IsUser(BasePermission):
    def has_permission(self, request, view):
        print(f"Authenticated: {request.user.is_authenticated}, Role: {getattr(request.user, 'role', None)}")
        return request.user.is_authenticated and getattr(request.user, 'role', None) == 'user'

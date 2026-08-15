from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    LoginSerializer,
    LogoutSerializer,
    RegisterSerializer,
    UpdateProfileSerializer,
    UserSerializer,
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    VerifyPasswordResetOTPSerializer,
    ResetPasswordSerializer,
    VerifyEmailSerializer,
    ResendVerificationOTPSerializer,
)

from .throttles import (
    LoginRateThrottle,
    OTPRateThrottle,
    PasswordResetRateThrottle,
)


class RegisterAPIView(generics.GenericAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [OTPRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = serializer.save()

        return Response(
            {
                "message":
                    "Account created successfully.",

                "user":
                    UserSerializer(
                        user,
                        context={
                            "request": request
                        },
                    ).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginAPIView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data=request.data,
            context={
                "request": request
            },
        )

        serializer.is_valid(
            raise_exception=True
        )

        return Response(
            {
                "message":
                    "Login successful.",

                **serializer.validated_data,
            },
            status=status.HTTP_200_OK,
        )


class LogoutAPIView(generics.GenericAPIView):
    serializer_class = LogoutSerializer

    permission_classes = [
        permissions.IsAuthenticated
    ]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        return Response(
            {
                "message":
                    "Logout successful."
            },
            status=status.HTTP_200_OK,
        )


class CurrentUserAPIView(APIView):
    permission_classes = [
        permissions.IsAuthenticated
    ]

    def get(self, request):
        serializer = UserSerializer(
            request.user,
            context={
                "request": request
            },
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def patch(self, request):
        profile = request.user.profile

        serializer = UpdateProfileSerializer(
            profile,
            data=request.data,
            partial=True,
            context={
                "request": request
            },
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            {
                "message":
                    "Profile updated successfully.",

                "user":
                    UserSerializer(
                        request.user,
                        context={
                            "request": request
                        },
                    ).data,
            },
            status=status.HTTP_200_OK,
        )


class ChangePasswordAPIView(
    generics.GenericAPIView
):
    serializer_class = ChangePasswordSerializer

    permission_classes = [
        permissions.IsAuthenticated
    ]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data=request.data,
            context={
                "request": request
            },
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            {
                "message":
                    "Password changed successfully."
            },
            status=status.HTTP_200_OK,
        )


class ForgotPasswordAPIView(
    generics.GenericAPIView
):
    serializer_class = ForgotPasswordSerializer

    permission_classes = [
        permissions.AllowAny
    ]

    throttle_classes = [
        PasswordResetRateThrottle
    ]

    def post(self, request):
        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            {
                "message": (
                    "If this email exists, "
                    "an OTP has been sent."
                )
            },
            status=status.HTTP_200_OK,
        )


class VerifyPasswordResetOTPAPIView(
    generics.GenericAPIView
):
    serializer_class = (
        VerifyPasswordResetOTPSerializer
    )

    permission_classes = [
        permissions.AllowAny
    ]

    throttle_classes = [
        PasswordResetRateThrottle
    ]

    def post(self, request):
        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        return Response(
            {
                "message":
                    "OTP verified successfully."
            },
            status=status.HTTP_200_OK,
        )


class ResetPasswordAPIView(
    generics.GenericAPIView
):
    serializer_class = ResetPasswordSerializer

    permission_classes = [
        permissions.AllowAny
    ]

    throttle_classes = [
        PasswordResetRateThrottle
    ]

    def post(self, request):
        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            {
                "message":
                    "Password reset successful."
            },
            status=status.HTTP_200_OK,
        )


class VerifyEmailAPIView(
    generics.GenericAPIView
):
    serializer_class = VerifyEmailSerializer

    permission_classes = [
        permissions.AllowAny
    ]

    throttle_classes = [
        OTPRateThrottle
    ]

    def post(self, request):
        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            {
                "message":
                    "Email verified successfully."
            },
            status=status.HTTP_200_OK,
        )


class ResendVerificationOTPAPIView(
    generics.GenericAPIView
):
    serializer_class = (
        ResendVerificationOTPSerializer
    )

    permission_classes = [
        permissions.AllowAny
    ]

    throttle_classes = [
        OTPRateThrottle
    ]

    def post(self, request):
        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            {
                "message": (
                    "If this email exists, "
                    "a new verification OTP "
                    "has been sent."
                )
            },
            status=status.HTTP_200_OK,
        )
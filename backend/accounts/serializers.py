import secrets
from config.gmail_service import send_gmail_email


from datetime import timedelta

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import PasswordResetOTP, Profile, EmailVerificationOTP

User = get_user_model()


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = (
            "phone",
            "profile_image",
            "role",
            "bio",
            "date_of_birth",
            "gender",
            "city",
            "state",
            "country",
            "postal_code",
            "is_verified",
        )
        read_only_fields = (
            "role",
            "is_verified",
        )

    def validate_phone(self, value):
        if not value:
            return value

        phone = value.strip().replace(" ", "")

        if not phone.isdigit():
            raise serializers.ValidationError(
                "Phone number must contain digits only."
            )

        if len(phone) != 10:
            raise serializers.ValidationError(
                "Enter a valid 10-digit phone number."
            )

        queryset = Profile.objects.filter(phone=phone)

        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "Phone number already exists."
            )

        return phone


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    phone = serializers.CharField(
        source="profile.phone",
        read_only=True,
    )

    profile_image = serializers.ImageField(
        source="profile.profile_image",
        read_only=True,
    )

    bio = serializers.CharField(
        source="profile.bio",
        read_only=True,
    )

    date_of_birth = serializers.DateField(
        source="profile.date_of_birth",
        read_only=True,
    )

    gender = serializers.CharField(
        source="profile.gender",
        read_only=True,
    )

    city = serializers.CharField(
        source="profile.city",
        read_only=True,
    )

    state = serializers.CharField(
        source="profile.state",
        read_only=True,
    )

    country = serializers.CharField(
        source="profile.country",
        read_only=True,
    )

    postal_code = serializers.CharField(
        source="profile.postal_code",
        read_only=True,
    )

    role = serializers.CharField(
        source="profile.role",
        read_only=True,
    )

    is_verified = serializers.BooleanField(
        source="profile.is_verified",
        read_only=True,
    )

    is_admin = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "full_name",
            "email",
            "phone",
            "profile_image",
            "bio",
            "date_of_birth",
            "gender",
            "city",
            "state",
            "country",
            "postal_code",
            "role",
            "is_verified",
            "is_admin",
            "is_staff",
            "is_superuser",
            "date_joined",
        )
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

    def get_is_admin(self, obj):
        return obj.is_staff or obj.is_superuser


class RegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(
        max_length=150,
        required=True,
    )

    email = serializers.EmailField(
        required=True,
    )

    phone = serializers.CharField(
        max_length=15,
        required=True,
    )

    password = serializers.CharField(
        write_only=True,
        min_length=8,
        trim_whitespace=False,
    )

    confirm_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )

    def validate_full_name(self, value):
        value = " ".join(value.strip().split())

        if len(value) < 2:
            raise serializers.ValidationError(
                "Please enter your full name."
            )

        return value

    def validate_email(self, value):
        email = value.strip().lower()

        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return email

    def validate_phone(self, value):
        phone = value.strip().replace(" ", "")

        if not phone.isdigit():
            raise serializers.ValidationError(
                "Phone number must contain digits only."
            )

        if len(phone) != 10:
            raise serializers.ValidationError(
                "Enter a valid 10-digit phone number."
            )

        if Profile.objects.filter(phone=phone).exists():
            raise serializers.ValidationError(
                "An account with this phone number already exists."
            )

        return phone

    def validate(self, attrs):
        password = attrs.get("password")
        confirm_password = attrs.get("confirm_password")

        if password != confirm_password:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match."
            })

        temporary_user = User(
            username=attrs.get("email"),
            email=attrs.get("email"),
        )

        try:
            validate_password(
                password,
                user=temporary_user,
            )
        except DjangoValidationError as error:
            raise serializers.ValidationError({
                "password": list(error.messages)
            }) from error

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop("confirm_password")

        full_name = validated_data.pop("full_name")
        phone = validated_data.pop("phone")
        password = validated_data.pop("password")
        email = validated_data.pop("email")

        name_parts = full_name.split(" ", 1)

        first_name = name_parts[0]
        last_name = (
            name_parts[1]
            if len(name_parts) > 1
            else ""
        )

        user = User.objects.create_user(
            username=email,
            email=email,
            first_name=first_name,
            last_name=last_name,
            password=password,
        )

        profile, _ = Profile.objects.get_or_create(
            user=user
        )

        profile.phone = phone
        profile.is_verified = False

        profile.save(
            update_fields=[
                "phone",
                "is_verified",
                "updated_at",
            ]
        )

        otp_code = (
            f"{secrets.randbelow(1_000_000):06d}"
        )

        EmailVerificationOTP.objects.filter(
            user=user,
            is_used=False,
        ).update(
            is_used=True
        )

        verification_otp = (
            EmailVerificationOTP.objects.create(
                user=user,
                otp=otp_code,
                expires_at=(
                    timezone.now()
                    + timedelta(minutes=10)
                ),
            )
        )

        display_name = (
            user.get_full_name()
            or user.username
            or "Customer"
        )

        subject = (
            "Verify your G-Class Lounge account"
        )

        text_body = (
            f"Hello {display_name},\n\n"
            f"Your email verification OTP is: "
            f"{otp_code}\n\n"
            "This OTP will expire in 10 minutes.\n"
            "Do not share this OTP with anyone.\n\n"
            "G-Class Lounge"
        )

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <body style="
            margin:0;
            padding:0;
            background:#080808;
            font-family:Arial,sans-serif;
            color:#ffffff;
        ">
            <div style="
                max-width:600px;
                margin:30px auto;
                background:#151311;
                border:1px solid #d4af3755;
                border-radius:20px;
                overflow:hidden;
            ">
                <div style="
                    background:#000000;
                    padding:28px;
                    text-align:center;
                    border-bottom:1px solid #d4af3733;
                ">
                    <h1 style="
                        margin:0;
                        color:#D4AF37;
                        letter-spacing:2px;
                    ">
                        G-CLASS LOUNGE
                    </h1>

                    <p style="
                        margin:8px 0 0;
                        color:#999999;
                        font-size:12px;
                        letter-spacing:3px;
                    ">
                        LUXURY CHAI CAFE
                    </p>
                </div>

                <div style="padding:36px 30px;">
                    <h2 style="margin-top:0;">
                        Verify Your Email
                    </h2>

                    <p style="
                        color:#c7c7c7;
                        line-height:1.7;
                    ">
                        Hello {display_name}, use the OTP
                        below to verify your G-Class Lounge
                        account.
                    </p>

                    <div style="
                        margin:30px 0;
                        padding:22px;
                        background:#0d0c0b;
                        border:1px solid #D4AF37;
                        border-radius:14px;
                        text-align:center;
                    ">
                        <div style="
                            font-size:38px;
                            font-weight:bold;
                            letter-spacing:10px;
                            color:#D4AF37;
                        ">
                            {otp_code}
                        </div>
                    </div>

                    <p style="
                        color:#c7c7c7;
                        line-height:1.7;
                    ">
                        This OTP expires in
                        <strong style="color:#D4AF37;">
                            10 minutes
                        </strong>.
                    </p>

                    <p style="
                        color:#ff9a9a;
                        line-height:1.7;
                    ">
                        Never share this OTP with anyone.
                    </p>

                    <p style="
                        color:#888888;
                        font-size:13px;
                        line-height:1.6;
                    ">
                        If you did not create this account,
                        you can safely ignore this email.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """

        try:
            send_gmail_email(
                subject=subject,
                message=text_body,
                recipient=user.email,
            )

        except Exception as error:
            verification_otp.delete()

            raise serializers.ValidationError({
                "email": (
                    "Unable to send verification "
                    "email right now. Please try again."
                )
            }) from error

        return user    

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(
        required=True,
    )

    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        required=True,
    )

    def validate(self, attrs):
        email = attrs.get(
            "email",
            "",
        ).strip().lower()

        password = attrs.get("password")

        user = authenticate(
            request=self.context.get("request"),
            username=email,
            password=password,
        )

        if user is None:
            raise serializers.ValidationError({
                "detail": "Invalid email or password."
            })

        if not user.is_active:
            raise serializers.ValidationError({
                "detail": "This account has been disabled."
            })

        if not user.profile.is_verified:
            raise serializers.ValidationError({
                "email": (
                    "Please verify your email before logging in."
                )
            })

        refresh = RefreshToken.for_user(user)

        return {
            "user": UserSerializer(
                user,
                context=self.context,
            ).data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }    

class UpdateProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(
        required=False,
        max_length=150,
    )

    class Meta:
        model = Profile
        fields = (
            "full_name",
            "phone",
            "bio",
            "date_of_birth",
            "gender",
            "city",
            "state",
            "country",
            "postal_code",
            "profile_image",
        )

    def validate_full_name(self, value):
        value = " ".join(value.strip().split())

        if len(value) < 2:
            raise serializers.ValidationError(
                "Please enter a valid full name."
            )

        return value

    def validate_phone(self, value):
        if not value:
            return value

        phone = value.strip().replace(" ", "")

        if not phone.isdigit():
            raise serializers.ValidationError(
                "Phone number must contain digits only."
            )

        if len(phone) != 10:
            raise serializers.ValidationError(
                "Enter a valid 10-digit phone number."
            )

        queryset = Profile.objects.filter(
            phone=phone
        )

        if self.instance:
            queryset = queryset.exclude(
                pk=self.instance.pk
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "Phone number already exists."
            )

        return phone

    def validate_profile_image(self, value):
        if not value:
            return value

        allowed_types = (
            "image/jpeg",
            "image/png",
            "image/webp",
        )

        content_type = getattr(
            value,
            "content_type",
            None,
        )

        if content_type not in allowed_types:
            raise serializers.ValidationError(
                "Only JPG, PNG and WEBP images are allowed."
            )

        max_size = 5 * 1024 * 1024

        if value.size > max_size:
            raise serializers.ValidationError(
                "Profile image must be smaller than 5 MB."
            )

        return value

    @transaction.atomic
    def update(self, instance, validated_data):
        full_name = validated_data.pop(
            "full_name",
            None,
        )

        if full_name is not None:
            name_parts = full_name.split(" ", 1)

            instance.user.first_name = name_parts[0]
            instance.user.last_name = (
                name_parts[1]
                if len(name_parts) > 1
                else ""
            )

            instance.user.save(
                update_fields=[
                    "first_name",
                    "last_name",
                ]
            )

        return super().update(
            instance,
            validated_data,
        )


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )

    new_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        min_length=8,
    )

    confirm_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )

    def validate(self, attrs):
        user = self.context["request"].user

        current_password = attrs["current_password"]
        new_password = attrs["new_password"]
        confirm_password = attrs["confirm_password"]

        if not user.check_password(current_password):
            raise serializers.ValidationError({
                "current_password":
                    "Current password is incorrect."
            })

        if new_password != confirm_password:
            raise serializers.ValidationError({
                "confirm_password":
                    "Passwords do not match."
            })

        if current_password == new_password:
            raise serializers.ValidationError({
                "new_password":
                    "New password must be different."
            })

        try:
            validate_password(
                new_password,
                user=user,
            )

        except DjangoValidationError as error:
            raise serializers.ValidationError({
                "new_password": list(error.messages)
            }) from error

        attrs["user"] = user

        return attrs

    def save(self):
        user = self.validated_data["user"]

        user.set_password(
            self.validated_data["new_password"]
        )

        user.save(
            update_fields=["password"]
        )

        return user    


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        return value.strip().lower()

    def save(self):
        email = self.validated_data["email"]

        user = User.objects.filter(
            email__iexact=email,
            is_active=True,
        ).first()

        # Security: registered aur unregistered email par
        # API response same rahega.
        if not user:
            return None

        recent_otp = PasswordResetOTP.objects.filter(
            user=user,
            is_used=False,
            created_at__gte=timezone.now() - timedelta(seconds=60),
        ).first()

        if recent_otp:
            raise serializers.ValidationError({
                "email": (
                    "OTP was already sent. "
                    "Please wait 60 seconds before requesting another."
                )
            })

        # Purane unused OTP invalidate kar do
        PasswordResetOTP.objects.filter(
            user=user,
            is_used=False,
        ).update(is_used=True)

        otp_code = f"{secrets.randbelow(1_000_000):06d}"

        otp = PasswordResetOTP.objects.create(
            user=user,
            otp=otp_code,
            expires_at=timezone.now() + timedelta(minutes=5),
        )

        display_name = (
            user.get_full_name()
            or user.username
            or "Customer"
        )

        subject = "Your G-Class Lounge password reset OTP"

        text_body = (
            f"Hello {display_name},\n\n"
            f"Your password reset OTP is: {otp_code}\n\n"
            "This OTP will expire in 5 minutes.\n"
            "Do not share this OTP with anyone.\n\n"
            "If you did not request this reset, ignore this email.\n\n"
            "G-Class Lounge"
        )

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <body style="
            margin:0;
            padding:0;
            background:#080808;
            font-family:Arial,sans-serif;
            color:#ffffff;
        ">
            <div style="
                max-width:600px;
                margin:30px auto;
                background:#151311;
                border:1px solid #d4af3755;
                border-radius:20px;
                overflow:hidden;
            ">
                <div style="
                    background:#000000;
                    padding:28px;
                    text-align:center;
                    border-bottom:1px solid #d4af3733;
                ">
                    <h1 style="
                        margin:0;
                        color:#D4AF37;
                        letter-spacing:2px;
                    ">
                        G-CLASS LOUNGE
                    </h1>

                    <p style="
                        margin:8px 0 0;
                        color:#999999;
                        font-size:12px;
                        letter-spacing:3px;
                    ">
                        LUXURY CHAI CAFE
                    </p>
                </div>

                <div style="padding:36px 30px;">
                    <h2 style="margin-top:0;">
                        Password Reset
                    </h2>

                    <p style="
                        color:#c7c7c7;
                        line-height:1.7;
                    ">
                        Hello {display_name}, use the OTP below to reset
                        your G-Class Lounge account password.
                    </p>

                    <div style="
                        margin:30px 0;
                        padding:22px;
                        background:#0d0c0b;
                        border:1px solid #D4AF37;
                        border-radius:14px;
                        text-align:center;
                    ">
                        <div style="
                            font-size:38px;
                            font-weight:bold;
                            letter-spacing:10px;
                            color:#D4AF37;
                        ">
                            {otp_code}
                        </div>
                    </div>

                    <p style="
                        color:#c7c7c7;
                        line-height:1.7;
                    ">
                        This OTP expires in
                        <strong style="color:#D4AF37;">
                            5 minutes
                        </strong>.
                    </p>

                    <p style="
                        color:#ff9a9a;
                        line-height:1.7;
                    ">
                        Never share this OTP with anyone.
                    </p>

                    <p style="
                        color:#888888;
                        font-size:13px;
                        line-height:1.6;
                    ">
                        If you did not request a password reset,
                        you can safely ignore this email.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """

        try:
            send_gmail_email(
                subject=subject,
                message=text_body,
                recipient=user.email,
            )

        except Exception as error:
            otp.delete()

            raise serializers.ValidationError({
                "email": (
                    "Unable to send OTP email right now. "
                    "Please try again later."
                )
            }) from error
        

        return otp


class VerifyPasswordResetOTPSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    otp = serializers.CharField(
        required=True,
        min_length=6,
        max_length=6,
        trim_whitespace=True,
    )

    def validate(self, attrs):
        email = attrs["email"].strip().lower()
        otp_code = attrs["otp"].strip()

        if not otp_code.isdigit():
            raise serializers.ValidationError({
                "otp": "OTP must contain 6 digits."
            })

        user = User.objects.filter(
            email__iexact=email,
            is_active=True,
        ).first()

        if not user:
            raise serializers.ValidationError({
                "otp": "Invalid or expired OTP."
            })

        otp = PasswordResetOTP.objects.filter(
            user=user,
            otp=otp_code,
            is_used=False,
        ).order_by("-created_at").first()

        if not otp:
            raise serializers.ValidationError({
                "otp": "Invalid or expired OTP."
            })

        if otp.is_expired:
            otp.is_used = True
            otp.save(update_fields=["is_used"])

            raise serializers.ValidationError({
                "otp": "OTP has expired. Request a new OTP."
            })

        attrs["user"] = user
        attrs["otp_object"] = otp

        return attrs


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    otp = serializers.CharField(
        required=True,
        min_length=6,
        max_length=6,
        trim_whitespace=True,
    )

    new_password = serializers.CharField(
        required=True,
        write_only=True,
        min_length=8,
        trim_whitespace=False,
    )

    confirm_password = serializers.CharField(
        required=True,
        write_only=True,
        trim_whitespace=False,
    )

    def validate(self, attrs):
        email = attrs["email"].strip().lower()
        otp_code = attrs["otp"].strip()
        new_password = attrs["new_password"]
        confirm_password = attrs["confirm_password"]

        if new_password != confirm_password:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match."
            })

        user = User.objects.filter(
            email__iexact=email,
            is_active=True,
        ).first()

        if not user:
            raise serializers.ValidationError({
                "otp": "Invalid or expired OTP."
            })

        otp = PasswordResetOTP.objects.filter(
            user=user,
            otp=otp_code,
            is_used=False,
        ).order_by("-created_at").first()

        if not otp or otp.is_expired:
            raise serializers.ValidationError({
                "otp": "Invalid or expired OTP."
            })

        try:
            validate_password(
                new_password,
                user=user,
            )
        except DjangoValidationError as error:
            raise serializers.ValidationError({
                "new_password": list(error.messages)
            }) from error

        attrs["user"] = user
        attrs["otp_object"] = otp

        return attrs

    @transaction.atomic
    def save(self):
        user = self.validated_data["user"]
        otp = self.validated_data["otp_object"]

        user.set_password(
            self.validated_data["new_password"]
        )

        user.save(
            update_fields=["password"]
        )

        otp.is_used = True
        otp.save(
            update_fields=["is_used"]
        )

        PasswordResetOTP.objects.filter(
            user=user,
            is_used=False,
        ).update(is_used=True)

        return user    


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(
        required=True,
    )

    def validate_refresh(self, value):
        try:
            token = RefreshToken(value)
            token.blacklist()

        except Exception as error:
            raise serializers.ValidationError(
                "Invalid or expired refresh token."
            ) from error

        return value

class ResendVerificationOTPSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        return value.strip().lower()

    def save(self):
        email = self.validated_data["email"]

        user = User.objects.filter(
            email__iexact=email,
            is_active=True,
        ).first()

        if not user:
            return None

        if user.profile.is_verified:
            raise serializers.ValidationError({
                "email": "This email is already verified."
            })

        recent_otp = EmailVerificationOTP.objects.filter(
            user=user,
            is_used=False,
            created_at__gte=(
                timezone.now()
                - timedelta(seconds=60)
            ),
        ).first()

        if recent_otp:
            raise serializers.ValidationError({
                "email": (
                    "OTP was already sent. "
                    "Please wait 60 seconds."
                )
            })

        EmailVerificationOTP.objects.filter(
            user=user,
            is_used=False,
        ).update(is_used=True)

        otp_code = (
            f"{secrets.randbelow(1_000_000):06d}"
        )

        verification_otp = (
            EmailVerificationOTP.objects.create(
                user=user,
                otp=otp_code,
                expires_at=(
                    timezone.now()
                    + timedelta(minutes=10)
                ),
            )
        )

        display_name = (
            user.get_full_name()
            or user.username
            or "Customer"
        )

        subject = (
            "Your new G-Class Lounge verification OTP"
        )

        text_body = (
            f"Hello {display_name},\n\n"
            f"Your new verification OTP is: "
            f"{otp_code}\n\n"
            "This OTP expires in 10 minutes.\n"
            "Do not share it with anyone.\n\n"
            "G-Class Lounge"
        )

        try:
            send_gmail_email(
                subject=subject,
                message=text_body,
                recipient=user.email,
            )

        except Exception as error:
            verification_otp.delete()

            raise serializers.ValidationError({
                "email": (
                    "Unable to resend verification OTP. "
                    "Please try again later."
                )
            }) from error

        return verification_otp    


class VerifyEmailSerializer(serializers.Serializer):

    email = serializers.EmailField()

    otp = serializers.CharField(
        max_length=6,
    )

    def validate(self, attrs):

        email = attrs["email"].strip().lower()
        otp = attrs["otp"].strip()

        try:
            user = User.objects.get(
                email__iexact=email
            )

        except User.DoesNotExist:
            raise serializers.ValidationError({
                "email": "User not found."
            })

        verification = (
            EmailVerificationOTP.objects
            .filter(
                user=user,
                otp=otp,
                is_used=False,
            )
            .order_by("-created_at")
            .first()
        )

        if verification is None:

            raise serializers.ValidationError({
                "otp": "Invalid OTP."
            })

        if verification.is_expired:

            raise serializers.ValidationError({
                "otp": "OTP has expired."
            })

        attrs["user"] = user
        attrs["verification"] = verification

        return attrs

    def save(self):

        user = self.validated_data["user"]

        verification = self.validated_data["verification"]

        verification.is_used = True
        verification.save(update_fields=["is_used"])

        profile = user.profile

        profile.is_verified = True

        profile.save(update_fields=["is_verified"])    
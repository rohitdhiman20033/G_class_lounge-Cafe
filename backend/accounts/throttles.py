from rest_framework.throttling import AnonRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    scope = "login"


class OTPRateThrottle(AnonRateThrottle):
    scope = "otp"


class PasswordResetRateThrottle(AnonRateThrottle):
    scope = "password_reset"
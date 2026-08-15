import logging
import re


class SensitiveDataFilter(logging.Filter):

    SENSITIVE_PATTERNS = [
        (
            re.compile(
                r'(?i)(password["\']?\s*[:=]\s*["\']?)[^,\s"\']+'
            ),
            r'\1***REDACTED***',
        ),
        (
            re.compile(
                r'(?i)(otp["\']?\s*[:=]\s*["\']?)[^,\s"\']+'
            ),
            r'\1***REDACTED***',
        ),
        (
            re.compile(
                r'(?i)(token["\']?\s*[:=]\s*["\']?)[^,\s"\']+'
            ),
            r'\1***REDACTED***',
        ),
        (
            re.compile(
                r'(?i)(authorization["\']?\s*[:=]\s*["\']?)[^,\s"\']+'
            ),
            r'\1***REDACTED***',
        ),
    ]

    def filter(self, record):
        message = record.getMessage()

        for pattern, replacement in self.SENSITIVE_PATTERNS:
            message = pattern.sub(
                replacement,
                message
            )

        record.msg = message
        record.args = ()

        return True
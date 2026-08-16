import base64
from email.message import EmailMessage

from django.conf import settings
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build


SCOPES = [
    "https://www.googleapis.com/auth/gmail.send"
]


def _get_credentials():
    return Credentials(
        token=None,
        refresh_token=settings.GMAIL_REFRESH_TOKEN,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.GMAIL_CLIENT_ID,
        client_secret=settings.GMAIL_CLIENT_SECRET,
        scopes=SCOPES,
    )


def send_gmail_email(
    subject,
    message,
    recipient,
):
    creds = _get_credentials()

    service = build(
        "gmail",
        "v1",
        credentials=creds,
        cache_discovery=False,
    )

    email_message = EmailMessage()
    email_message["To"] = recipient
    email_message["From"] = settings.GMAIL_FROM_EMAIL
    email_message["Subject"] = subject
    email_message.set_content(message)

    encoded_message = base64.urlsafe_b64encode(
        email_message.as_bytes()
    ).decode()

    service.users().messages().send(
        userId="me",
        body={
            "raw": encoded_message
        },
    ).execute()
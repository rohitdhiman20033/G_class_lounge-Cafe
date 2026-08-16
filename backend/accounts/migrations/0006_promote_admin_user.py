from django.db import migrations


ADMIN_EMAIL = "rohitdhiman20033@gmail.com"


def promote_admin(apps, schema_editor):
    User = apps.get_model("auth", "User")

    user = User.objects.filter(
        email__iexact=ADMIN_EMAIL
    ).first()

    if user:
        user.is_staff = True
        user.is_superuser = True
        user.save(
            update_fields=[
                "is_staff",
                "is_superuser",
            ]
        )


def reverse_promote_admin(apps, schema_editor):
    User = apps.get_model("auth", "User")

    user = User.objects.filter(
        email__iexact=ADMIN_EMAIL
    ).first()

    if user:
        user.is_staff = False
        user.is_superuser = False
        user.save(
            update_fields=[
                "is_staff",
                "is_superuser",
            ]
        )


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0005_emailverificationotp"),
    ]

    operations = [
        migrations.RunPython(
            promote_admin,
            reverse_promote_admin,
        ),
    ]
from django.db import models


class AboutSection(models.Model):

    eyebrow = models.CharField(max_length=100)

    title = models.CharField(max_length=200)

    highlighted_text = models.CharField(max_length=100)

    description = models.TextField()

    image = models.ImageField(upload_to="about/")

    feature1_title = models.CharField(max_length=100)
    feature1_description = models.TextField()

    feature2_title = models.CharField(max_length=100)
    feature2_description = models.TextField()

    feature3_title = models.CharField(max_length=100)
    feature3_description = models.TextField()

    feature4_title = models.CharField(max_length=100)
    feature4_description = models.TextField()

    customers = models.CharField(max_length=20)

    menu_items = models.CharField(max_length=20)

    rating = models.CharField(max_length=20)

    primary_button = models.CharField(max_length=100)

    primary_link = models.CharField(max_length=200)

    secondary_button = models.CharField(max_length=100)

    secondary_link = models.CharField(max_length=200)

    signature_text = models.TextField()

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title



class HeroSection(models.Model):

    eyebrow = models.CharField(
        max_length=120
    )

    title = models.CharField(
        max_length=200
    )

    highlighted_text = models.CharField(
        max_length=120
    )

    description = models.TextField()

    desktop_image = models.ImageField(
        upload_to="hero/"
    )

    mobile_image = models.ImageField(
        upload_to="hero/",
        blank=True,
        null=True
    )

    primary_button_text = models.CharField(
        max_length=100
    )

    primary_button_link = models.CharField(
        max_length=200,
        default="#menu"
    )

    secondary_button_text = models.CharField(
        max_length=100
    )

    secondary_button_link = models.CharField(
        max_length=200,
        default="#events"
    )

    stat1_value = models.CharField(
        max_length=20
    )

    stat1_label = models.CharField(
        max_length=80
    )

    stat2_value = models.CharField(
        max_length=20
    )

    stat2_label = models.CharField(
        max_length=80
    )

    stat3_value = models.CharField(
        max_length=20
    )

    stat3_label = models.CharField(
        max_length=80
    )

    feature1_text = models.CharField(
        max_length=100
    )

    feature2_text = models.CharField(
        max_length=100
    )

    feature3_text = models.CharField(
        max_length=100
    )

    feature4_text = models.CharField(
        max_length=100
    )

    feature5_text = models.CharField(
        max_length=100
    )

    is_active = models.BooleanField(
        default=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        verbose_name = "Hero Section"
        verbose_name_plural = "Hero Section"

    def __str__(self):
        return self.title    


class WebsiteSettings(models.Model):

    site_name = models.CharField(max_length=100)

    tagline = models.CharField(
    max_length=200,
    blank=True
    )

    logo = models.ImageField(
    upload_to="website/logo/",
    blank=True,
    null=True
    )

    favicon = models.ImageField(
    upload_to="website/favicon/",
    blank=True,
    null=True
    )

    footer_description = models.TextField()

    phone = models.CharField(max_length=20)

    email = models.EmailField()

    address = models.TextField()

    google_maps_url = models.URLField(
        blank=True
    )

    whatsapp_number = models.CharField(max_length=20 ,blank=True)

    weekday_label = models.CharField(max_length=100)

    weekday_hours = models.CharField(max_length=100)

    weekend_label = models.CharField(max_length=100)

    weekend_hours = models.CharField(max_length=100)

    facebook_url = models.URLField(blank=True)

    instagram_url = models.URLField(blank=True)

    twitter_url = models.URLField(blank=True)

    youtube_url = models.URLField(blank=True)

    copyright_text = models.CharField(max_length=250)

    made_with_text = models.CharField(max_length=200)

    is_active = models.BooleanField(default=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Website Settings"
        verbose_name_plural = "Website Settings"

    def __str__(self):
        return self.site_name    
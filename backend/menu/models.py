from django.db import models

class MenuItem(models.Model):
    CATEGORY_CHOICES = [
        ("Coffee", "Coffee"),
        ("Tea", "Tea"),
        ("Burger", "Burger"),
        ("Pizza", "Pizza"),
        ("Dessert", "Dessert"),
    ]

    name = models.CharField(max_length=150)
    description = models.TextField()
    price = models.DecimalField(max_digits=8, decimal_places=2)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    image = models.ImageField(upload_to="menu/", blank=True, null=True)
    available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    rating = models.DecimalField(max_digits=2, decimal_places=1, default=4.5)
    badge = models.CharField(max_length=50, default="Popular")
    badge_color = models.CharField(max_length=20, default="yellow")
    featured = models.BooleanField(default=False)
    stock = models.PositiveIntegerField(default=100)
    preparation_time = models.PositiveIntegerField(default=10)

    def __str__(self):
        return self.name
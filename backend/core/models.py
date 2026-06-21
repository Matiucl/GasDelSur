# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models
import uuid 

class Cylinders(models.Model):
    id = models.UUIDField(primary_key=True)
    serial_number = models.CharField(max_length=50)
    type = models.TextField()  # This field type is a guess.
    status = models.TextField()  # This field type is a guess.
    driver = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)
    driver_name = models.CharField(max_length=150, blank=True, null=True)
    capture_url = models.TextField(blank=True, null=True)
    needs_manual_validation = models.BooleanField()
    registered_at = models.DateTimeField()

    class Meta:
        managed = True
        db_table = 'cylinders'


class DriverPositions(models.Model):
    driver = models.OneToOneField('Users', models.DO_NOTHING, primary_key=True)
    lat = models.FloatField()
    lng = models.FloatField()
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = True
        db_table = 'driver_positions'


class Orders(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    order_number = models.CharField(unique=True, max_length=20)
    client = models.ForeignKey('Users', models.DO_NOTHING)
    client_name = models.CharField(max_length=150)
    client_phone = models.CharField(max_length=20)
    address = models.TextField()
    lat = models.FloatField()
    lng = models.FloatField()
    product = models.ForeignKey('Products', models.DO_NOTHING, db_column='product')
    quantity = models.IntegerField()
    total = models.IntegerField()
    payment_method = models.TextField()  # This field type is a guess.
    notes = models.TextField(blank=True, null=True)
    status = models.TextField()  # This field type is a guess.
    security_token = models.CharField(max_length=4)
    driver = models.ForeignKey('Users', models.DO_NOTHING, related_name='orders_driver_set', blank=True, null=True)
    driver_name = models.CharField(max_length=150, blank=True, null=True)
    driver_plate = models.CharField(max_length=10, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = f"PED-{uuid.uuid4().hex[:8].upper()}"

        super().save(*args, **kwargs)

    class Meta:
        managed = True
        db_table = 'orders'


class Products(models.Model):
    id = models.CharField(primary_key=True, max_length=20)
    name = models.CharField(max_length=100)
    kg = models.DecimalField(max_digits=6, decimal_places=2)
    price = models.IntegerField()
    stock = models.IntegerField()

    class Meta:
        managed = True
        db_table = 'products'


class SpatialRefSys(models.Model):
    srid = models.IntegerField(primary_key=True)
    auth_name = models.CharField(max_length=256, blank=True, null=True)
    auth_srid = models.IntegerField(blank=True, null=True)
    srtext = models.CharField(max_length=2048, blank=True, null=True)
    proj4text = models.CharField(max_length=2048, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'spatial_ref_sys'


class Users(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    rut = models.CharField(unique=True, max_length=15)
    email = models.CharField(unique=True, max_length=150)
    phone = models.CharField(max_length=20)
    role = models.TextField() 
    password_hash = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_authenticated(self):
        return True

    class Meta:
        managed = True
        db_table = 'users'
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError
from App_User.models import CustomUser
from App_Event.models import Event, EventParticipant
from django.db.models.functions import TruncMonth

class PaymentStatus(models.TextChoices):
    PENDING = 'pending', _('Pending')
    COMPLETED = 'completed', _('Completed')
    FAILED = 'failed', _('Failed')
    REFUNDED = 'refunded', _('Refunded')
    PARTIALLY_REFUNDED = 'partially_refunded', _('Partially Refunded')
    CANCELLED = 'cancelled', _('Cancelled')

class PaymentType(models.TextChoices):
    EVENT_TICKET = 'event_ticket', _('Event Ticket')
    SUBSCRIPTION = 'subscription', _('Subscription')
    CANCELLATION_FEE = 'cancellation_fee', _('Cancellation Fee')

class Payment(models.Model):
    PAYMENT_METHODS = [
        ('credit_card', _('Credit Card')),
        ('debit_card', _('Debit Card')),
        ('paypal', _('PayPal')),
        ('bank_transfer', _('Bank Transfer')),
    ]
    
    user = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='payments', null=True
    )
    event = models.ForeignKey(
        Event, 
        on_delete=models.CASCADE, 
        related_name='payments', 
        null=True, 
        blank=True,
        help_text="Event associated with this payment. Can be null for subscription payments."
    )
    event_participant = models.ForeignKey(
        EventParticipant, 
        on_delete=models.CASCADE, 
        related_name='payments', 
        null=True, 
        blank=True,
        help_text="Event participant record associated with this payment."
    )
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        null=True,
        help_text="Payment amount in default currency"
    )
    currency = models.CharField(
        max_length=3, 
        default='USD',
        null=True,
        validators=[RegexValidator(r'^[A-Z]{3}$', 'Currency must be a valid 3-letter ISO 4217 code.')],
        help_text="Three-letter currency code (e.g., USD, EUR, GBP)"
    )
    payment_type = models.CharField(
        max_length=20,
        choices=PaymentType.choices,
        default=PaymentType.EVENT_TICKET,
        help_text="Type of payment (event ticket, subscription, etc.)", null=True
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHODS,
        blank=True,
        null=True,
        help_text="Method used for the payment"
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
        help_text="Current status of the payment", 
        null=True
    )
    transaction_id = models.CharField(
        max_length=100, 
        unique=True, 
        blank=True, 
        null=True,
        help_text="External payment processor transaction ID"
    )
    processor_fee = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        null=True, 
        blank=True,
        help_text="Fee charged by payment processor"
    )
    platform_fee = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        null=True, 
        blank=True,
        help_text="Fee charged by your platform"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    metadata = models.JSONField(
        null=True, 
        blank=True,
        help_text="Additional payment data in JSON format"
    )
    refunded_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        null=True, 
        blank=True,
        help_text="Amount refunded to customer"
    )
    refund_transaction_id = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="Transaction ID for the refund"
    )
    refund_reason = models.TextField(
        blank=True, 
        null=True,
        help_text="Reason for refund"
    )
    refunded_at = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="When the refund was processed"
    )
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['event']),
            models.Index(fields=['payment_status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['transaction_id']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'event', 'event_participant'],
                name='unique_payment_per_user_event_participant'
            )
        ]
    
    def clean(self):
        if self.amount <= 0:
            raise ValidationError("Amount must be greater than zero.")
        if self.event and self.event.is_paid and self.amount != self.event.price:
            raise ValidationError("Payment amount must match event price.")
    
    def __str__(self):
        event_name = self.event.title if self.event else "No Event"
        return f"Payment {self.id}: {self.user.email} - {event_name} - {self.amount} {self.currency} ({self.get_payment_status_display()})"
    
    @property
    def net_amount(self):
        total_fees = 0
        if self.processor_fee:
            total_fees += self.processor_fee
        if self.platform_fee:
            total_fees += self.platform_fee
        return self.amount - total_fees

class Subscription(models.Model):
    PLAN_TYPES = (
        ('free', 'Joiner (Free)'),
        ('creator', 'Creator'),
        ('premium', 'Premium'),
    )
    
    BILLING_CYCLES = (
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    )
    
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('canceled', 'Canceled'),
        ('past_due', 'Past Due'),
        ('trialing', 'Trialing'),
        ('unpaid', 'Unpaid'),
    )
    
    user = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='subscriptions'
    )
    plan_type = models.CharField(max_length=20, choices=PLAN_TYPES , null=True)
    billing_cycle = models.CharField(max_length=10, choices=BILLING_CYCLES, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', null=True)
    stripe_subscription_id = models.CharField(max_length=100, blank=True, null=True)
    stripe_customer_id = models.CharField(max_length=100, blank=True, null=True)
    start_date = models.DateTimeField(null=True)
    current_period_end = models.DateTimeField(help_text="When the current billing period ends",null=True)
    canceled_at = models.DateTimeField(null=True, blank=True)
    auto_renew = models.BooleanField(default=True, null=True)
    cancel_at_period_end = models.BooleanField(default=False, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Subscription'
        verbose_name_plural = 'Subscriptions'
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'status'],
                condition=models.Q(status='active'),
                name='unique_active_subscription_per_user'
            )
        ]
        
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.plan_type == 'premium' and self.status == 'active':
            self.user.is_premium = True
            self.user.save()
    
    def __str__(self):
        return f"{self.user.email} - {self.get_plan_type_display()} ({self.get_status_display()})"
    
    @property
    def is_active(self):
        return self.status == 'active'

class PaymentIntent(models.Model):
    STATUS_CHOICES = (
        ('requires_payment_method', 'Requires Payment Method'),
        ('requires_confirmation', 'Requires Confirmation'),
        ('requires_action', 'Requires Action'),
        ('processing', 'Processing'),
        ('requires_capture', 'Requires Capture'),
        ('canceled', 'Canceled'),
        ('succeeded', 'Succeeded'),
    )
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, null=True, blank=True)
    event_participant = models.ForeignKey(
        EventParticipant,
        on_delete=models.CASCADE,
        related_name='payment_intents',
        null=True,
        blank=True,
        help_text="Event participant record associated with this payment intent"
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(
        max_length=3,
        default='USD',
        null=True,
        validators=[RegexValidator(r'^[A-Z]{3}$', 'Currency must be a valid 3-letter ISO 4217 code.')]
    )
    payment_type = models.CharField(
        max_length=20,
        choices=PaymentType.choices,
        null=True,
        default=PaymentType.EVENT_TICKET
    )
    stripe_payment_intent_id = models.CharField(max_length=100, unique=True, null=True)
    stripe_client_secret = models.CharField(max_length=255, null=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='requires_payment_method', null=True)
    last_error = models.TextField(null=True, blank=True)
    payment = models.OneToOneField(
        Payment, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='payment_intent'
    )
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Payment Intent'
        verbose_name_plural = 'Payment Intents'
        
    def __str__(self):
        return f"Intent {self.id}: {self.user.email} - {self.amount} {self.currency} ({self.status})"
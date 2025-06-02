from django import template

register = template.Library()

@register.filter
def divide(value, arg):
    try:
        return int((int(value) + int(arg) - 1) // int(arg))  # Ceiling division
    except (ValueError, TypeError, ZeroDivisionError):
        return 0
    

@register.filter
def user_in(queryset, user):
    return queryset.filter(user=user).exists()
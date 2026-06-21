from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from .models import Users


class CustomJWTAuthentication(JWTAuthentication):
    """
    Igual que la autenticación JWT normal de simplejwt, pero busca el
    usuario en NUESTRA tabla 'users' (modelo Users), en vez de la tabla
    auth_user que usa Django por defecto.
    """
    def get_user(self, validated_token):
        user_id = validated_token.get('user_id')
        if user_id is None:
            raise InvalidToken('El token no contiene user_id')
        try:
            return Users.objects.get(id=user_id)
        except Users.DoesNotExist:
            raise InvalidToken('Usuario no encontrado')
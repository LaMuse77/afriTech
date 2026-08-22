from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from django.contrib.auth import authenticate

from .models import MemberProfile
from .serializers import MemberProfileSerializer, RegisterSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """Crée un nouveau membre et renvoie directement un token DRF."""
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()

    token, _ = Token.objects.get_or_create(user=user)
    profile, _ = MemberProfile.objects.get_or_create(user=user)
    return Response(
        {
            'token': token.key,
            'profile': MemberProfileSerializer(profile).data,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Authentifie un membre et renvoie un token DRF."""
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response(
            {'detail': 'Identifiant et mot de passe requis.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(username=username, password=password)
    if user is None:
        return Response(
            {'detail': 'Identifiants invalides.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    token, _ = Token.objects.get_or_create(user=user)
    return Response({'token': token.key})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Invalide le token courant."""
    Token.objects.filter(user=request.user).delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    """Renvoie le profil et les statistiques du membre connecté."""
    profile, _ = MemberProfile.objects.get_or_create(user=request.user)
    return Response(MemberProfileSerializer(profile).data)

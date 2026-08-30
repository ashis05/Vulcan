import datetime
import json

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec, rsa
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.core import auth
from app.core.auth import get_current_user

KEY_ID = "test-key-id"


def _make_keys():
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    jwk = jwt.algorithms.RSAAlgorithm.to_jwk(private_key.public_key())
    if isinstance(jwk, str):
        jwk = json.loads(jwk)
    return private_key, jwk


def _sign(private_key, *, sub="user-abc", aud="authenticated", expired=False):
    now = datetime.datetime.now(datetime.timezone.utc)
    payload = {
        "sub": sub,
        "aud": aud,
        "iat": now,
        "exp": now - datetime.timedelta(minutes=5) if expired else now + datetime.timedelta(hours=1),
    }
    return jwt.encode(payload, private_key, algorithm="RS256", headers={"kid": KEY_ID})


def _creds(token: str) -> HTTPAuthorizationCredentials:
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)


@pytest.fixture
def mock_jwks(monkeypatch):
    private_key, jwk = _make_keys()

    async def fake_get_jwks():
        return {"keys": [{**jwk, "kid": KEY_ID}]}

    monkeypatch.setattr(auth, "_get_jwks", fake_get_jwks)
    return private_key


@pytest.mark.asyncio
async def test_valid_token_accepted(mock_jwks):
    user_id = await get_current_user(_creds(_sign(mock_jwks, sub="user-abc")))
    assert user_id == "user-abc"


@pytest.mark.asyncio
async def test_missing_token_rejected():
    with pytest.raises(HTTPException) as exc:
        await get_current_user(None)
    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_garbage_token_rejected(mock_jwks):
    with pytest.raises(HTTPException) as exc:
        await get_current_user(_creds("definitely.not.a.jwt"))
    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_expired_token_rejected(mock_jwks):
    token = _sign(mock_jwks, expired=True)
    with pytest.raises(HTTPException) as exc:
        await get_current_user(_creds(token))
    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_wrong_audience_rejected(mock_jwks):
    token = _sign(mock_jwks, aud="other-audience")
    with pytest.raises(HTTPException) as exc:
        await get_current_user(_creds(token))
    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_es256_token_accepted(monkeypatch):
    # Supabase signs access tokens with ES256 (EC P-256) keys — mirror that.
    private_key = ec.generate_private_key(ec.SECP256R1())
    jwk = jwt.algorithms.ECAlgorithm.to_jwk(private_key.public_key())
    if isinstance(jwk, str):
        jwk = json.loads(jwk)

    async def fake_get_jwks():
        return {"keys": [{**jwk, "kid": KEY_ID}]}

    monkeypatch.setattr(auth, "_get_jwks", fake_get_jwks)

    now = datetime.datetime.now(datetime.timezone.utc)
    payload = {
        "sub": "user-ec",
        "aud": "authenticated",
        "iat": now,
        "exp": now + datetime.timedelta(hours=1),
    }
    token = jwt.encode(payload, private_key, algorithm="ES256", headers={"kid": KEY_ID})

    user_id = await get_current_user(_creds(token))
    assert user_id == "user-ec"
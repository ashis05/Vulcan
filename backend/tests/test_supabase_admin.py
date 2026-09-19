from app.services.supabase_admin import _image_mime


def test_trusts_real_image_content_type():
    assert _image_mime("user/a.jpg", "image/webp") == "image/webp"


def test_infers_from_extension_when_content_type_is_wrong():
    # Storage records Blob uploads without a type as text/plain — don't forward that.
    assert _image_mime("user/a.jpg", "text/plain") == "image/jpeg"
    assert _image_mime("user/a.png", "") == "image/png"
    assert _image_mime("user/a.webp", "application/octet-stream") == "image/webp"


def test_defaults_to_jpeg_for_unknown_extensions():
    assert _image_mime("user/a", "text/plain") == "image/jpeg"
    assert _image_mime("user/a.bin", "") == "image/jpeg"

import io
import pytest
from PIL import Image


def create_dummy_png():
    img = Image.new("RGB", (100, 100), color=(73, 109, 137))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@pytest.mark.asyncio
async def test_bad_file_type_rejected(client, auth_headers):
    # Upload text file instead of image
    files = {"files": ("not_an_image.txt", b"This is plain text content", "text/plain")}
    res = await client.post("/api/v1/food/analyze", files=files, headers=auth_headers)
    assert res.status_code == 400
    assert "Invalid or corrupted image" in res.json()["message"] or "Unsupported" in res.json()["message"]


@pytest.mark.asyncio
async def test_empty_file_rejected(client, auth_headers):
    files = {"file": ("empty.png", b"", "image/png")}
    res = await client.post("/api/v1/freshness/analyze", files=files, headers=auth_headers)
    assert res.status_code == 400
    assert "empty" in res.json()["message"].lower()


@pytest.mark.asyncio
async def test_oversize_image_rejected(client, auth_headers):
    # Create fake byte payload larger than 8 MB
    huge_bytes = b"0" * (9 * 1024 * 1024)
    files = {"files": ("huge.jpg", huge_bytes, "image/jpeg")}
    res = await client.post("/api/v1/food/analyze", files=files, headers=auth_headers)
    assert res.status_code == 400
    assert "exceeds maximum allowed size" in res.json()["message"].lower()


@pytest.mark.asyncio
async def test_valid_image_accepted(client, auth_headers):
    png_bytes = create_dummy_png()
    files = {"files": ("meal.png", png_bytes, "image/png")}
    res = await client.post("/api/v1/food/analyze", files=files, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["source"] == "demo_sample"
    assert "total_nutrition" in data
    assert len(data["identified_items"]) > 0

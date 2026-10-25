import io
import base64
from typing import Tuple
from PIL import Image, ImageOps


ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}
MAX_DIMENSION = 1600
THUMBNAIL_MAX_DIMENSION = 160
MAX_FILE_BYTES = 8 * 1024 * 1024  # 8 MB


def validate_and_process_image(image_bytes: bytes, max_bytes: int = MAX_FILE_BYTES) -> Tuple[bytes, str, str]:
    """
    Validates that the uploaded bytes are genuine JPEG/PNG/WEBP image data,
    strips EXIF metadata, resizes if dimension exceeds 1600px,
    and returns (processed_bytes, mime_type, base64_thumbnail_data_uri).
    """
    if len(image_bytes) > max_bytes:
        raise ValueError(f"Image file exceeds maximum allowed size of {max_bytes // (1024 * 1024)} MB.")

    if not image_bytes:
        raise ValueError("Image file is empty.")

    try:
        # Verify content with Pillow
        stream = io.BytesIO(image_bytes)
        with Image.open(stream) as img:
            img.verify()
    except Exception:
        raise ValueError("Invalid or corrupted image content. Only valid image files are accepted.")

    # Re-open for actual processing (verify closes/invalidates the stream in Pillow)
    stream = io.BytesIO(image_bytes)
    with Image.open(stream) as img:
        fmt = img.format
        if fmt not in ALLOWED_FORMATS:
            raise ValueError(f"Unsupported image format: {fmt}. Allowed formats: JPEG, PNG, WEBP.")

        # Orient image properly according to EXIF before stripping
        try:
            img = ImageOps.exif_transpose(img)
        except Exception:
            pass

        # Convert palette/transparency to RGB or RGBA
        if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
            mode = "RGBA"
        else:
            mode = "RGB"
        img = img.convert(mode)

        # Downscale if larger than MAX_DIMENSION
        width, height = img.size
        if width > MAX_DIMENSION or height > MAX_DIMENSION:
            img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.Resampling.LANCZOS)

        # Save processed clean image (EXIF stripped by re-saving into fresh buffer)
        output_buffer = io.BytesIO()
        mime_type = "image/jpeg"
        if mode == "RGBA":
            img.save(output_buffer, format="PNG", optimize=True)
            mime_type = "image/png"
        else:
            img.save(output_buffer, format="JPEG", quality=88, optimize=True)
            mime_type = "image/jpeg"
        processed_bytes = output_buffer.getvalue()

        # Generate small base64 thumbnail for history preview
        thumb = img.copy()
        thumb.thumbnail((THUMBNAIL_MAX_DIMENSION, THUMBNAIL_MAX_DIMENSION), Image.Resampling.LANCZOS)
        thumb_buffer = io.BytesIO()
        if thumb.mode == "RGBA":
            thumb.save(thumb_buffer, format="PNG", optimize=True)
            thumb_mime = "image/png"
        else:
            thumb.save(thumb_buffer, format="JPEG", quality=75, optimize=True)
            thumb_mime = "image/jpeg"
            
        b64_thumb = base64.b64encode(thumb_buffer.getvalue()).decode("utf-8")
        thumbnail_data_uri = f"data:{thumb_mime};base64,{b64_thumb}"

        return processed_bytes, mime_type, thumbnail_data_uri

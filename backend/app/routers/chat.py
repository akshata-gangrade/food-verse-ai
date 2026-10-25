import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from app.core.deps import get_current_user
from app.db.mongo import get_db
from app.utils.image import validate_and_process_image
from app.services.ai.provider_factory import get_ai_provider
from app.schemas.chat import (
    ChatSessionCreate, ChatSessionResponse, ChatMessage, RecipeSchema
)

router = APIRouter(prefix="/chat", tags=["Smart Cooking Assistant"])


@router.post("/sessions", response_model=ChatSessionResponse)
async def create_chat_session(
    payload: ChatSessionCreate = ChatSessionCreate(),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    session_id = f"ses_{uuid.uuid4().hex[:12]}"
    user_id = str(current_user["_id"])
    now = datetime.now(timezone.utc).isoformat()

    # Initial welcome message from assistant
    welcome_msg = {
        "role": "assistant",
        "content": "Hello Chef! I'm your Food Verse AI Cooking Assistant. Ask me anything about recipes, cooking techniques, food pairings, or what to cook with whatever ingredients you have on hand. You can also upload a photo or ask for step-by-step guided timers!",
        "recipe": None,
        "image_url": None,
        "timestamp": now
    }

    doc = {
        "_id": session_id,
        "user_id": user_id,
        "title": payload.title or "Culinary Assistant Chat",
        "created_at": now,
        "updated_at": now,
        "messages": [welcome_msg]
    }
    await db.chat_sessions.insert_one(doc)

    return ChatSessionResponse(
        id=session_id,
        user_id=user_id,
        title=doc["title"],
        created_at=now,
        updated_at=now,
        messages=[ChatMessage(**welcome_msg)]
    )


@router.get("/sessions", response_model=List[ChatSessionResponse])
async def list_chat_sessions(current_user=Depends(get_current_user), db=Depends(get_db)):
    user_id = str(current_user["_id"])
    cursor = db.chat_sessions.find({"user_id": user_id}).sort("updated_at", -1)
    sessions = []
    async for s in cursor:
        sessions.append(ChatSessionResponse(
            id=str(s["_id"]),
            user_id=s["user_id"],
            title=s["title"],
            created_at=s["created_at"],
            updated_at=s["updated_at"],
            messages=[ChatMessage(**m) for m in s.get("messages", [])]
        ))
    return sessions


@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_chat_session(session_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    user_id = str(current_user["_id"])
    s = await db.chat_sessions.find_one({"_id": session_id, "user_id": user_id})
    if not s:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "message": "Chat session not found.", "details": None}
        )
    return ChatSessionResponse(
        id=str(s["_id"]),
        user_id=s["user_id"],
        title=s["title"],
        created_at=s["created_at"],
        updated_at=s["updated_at"],
        messages=[ChatMessage(**m) for m in s.get("messages", [])]
    )


@router.post("/sessions/{session_id}/messages")
async def send_chat_message(
    session_id: str,
    message: str = Form(...),
    image: Optional[UploadFile] = File(None),
    audio: Optional[UploadFile] = File(None),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    user_id = str(current_user["_id"])
    session = await db.chat_sessions.find_one({"_id": session_id, "user_id": user_id})
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "message": "Chat session not found.", "details": None}
        )

    now = datetime.now(timezone.utc).isoformat()
    image_bytes = None
    image_mime = None
    thumbnail_uri = None

    if image:
        content = await image.read()
        if content:
            try:
                image_bytes, image_mime, thumbnail_uri = validate_and_process_image(content)
            except ValueError as ve:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={"error": "invalid_image", "message": str(ve), "details": None}
                )

    audio_bytes = None
    audio_mime = None
    if audio:
        acontent = await audio.read()
        if acontent:
            audio_bytes = acontent
            audio_mime = audio.content_type or "audio/mp3"

    user_msg_dict = {
        "role": "user",
        "content": message.strip(),
        "recipe": None,
        "image_url": thumbnail_uri,
        "timestamp": now
    }

    # Prepare history for AI
    existing_messages = [ChatMessage(**m) for m in session.get("messages", [])]

    provider = get_ai_provider()
    try:
        ai_result = await provider.generate_chat_reply(
            history=existing_messages,
            latest_message=message,
            image_bytes=image_bytes,
            image_mime=image_mime,
            audio_bytes=audio_bytes,
            audio_mime=audio_mime
        )
    except Exception as e:
        logger.error(f"Cooking Assistant generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"error": "ai_generation_failed", "message": f"Cooking Assistant AI error: {str(e)}", "details": None}
        )

    recipe_dict = None
    if ai_result.get("recipe"):
        r = ai_result["recipe"]
        recipe_dict = r.model_dump() if hasattr(r, "model_dump") else dict(r)
        if not recipe_dict.get("id"):
            recipe_dict["id"] = f"rec_{uuid.uuid4().hex[:12]}"
        recipe_dict["created_at"] = now

    assistant_msg_dict = {
        "role": "assistant",
        "content": ai_result.get("reply", "I'm ready to help with cooking."),
        "recipe": recipe_dict,
        "image_url": None,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    # Update session in db
    updated_messages = session.get("messages", []) + [user_msg_dict, assistant_msg_dict]
    title = session.get("title")
    if title == "Culinary Assistant Chat" and message:
        # Give title a clean preview
        title = message[:35] + ("..." if len(message) > 35 else "")

    await db.chat_sessions.update_one(
        {"_id": session_id},
        {"$set": {"messages": updated_messages, "updated_at": now, "title": title}}
    )

    return {
        "reply": assistant_msg_dict["content"],
        "recipe": recipe_dict,
        "messages": updated_messages
    }


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat_session(session_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    user_id = str(current_user["_id"])
    result = await db.chat_sessions.delete_one({"_id": session_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "message": "Session not found.", "details": None}
        )

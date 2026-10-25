import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.deps import get_current_user
from app.db.mongo import get_db
from app.schemas.chat import RecipeSchema

router = APIRouter(prefix="/recipes", tags=["Saved Recipes"])


@router.get("", response_model=List[RecipeSchema])
async def list_recipes(current_user=Depends(get_current_user), db=Depends(get_db)):
    user_id = str(current_user["_id"])
    cursor = db.recipes.find({"user_id": user_id}).sort("created_at", -1)
    results = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        results.append(RecipeSchema(**doc))
    return results


@router.post("", response_model=RecipeSchema, status_code=status.HTTP_201_CREATED)
async def save_recipe(recipe: RecipeSchema, current_user=Depends(get_current_user), db=Depends(get_db)):
    user_id = str(current_user["_id"])
    now = datetime.now(timezone.utc).isoformat()

    existing = await db.recipes.find_one({"_id": recipe.id, "user_id": user_id}) if recipe.id else None
    if existing:
        recipe_id = recipe.id
    else:
        conflict = await db.recipes.find_one({"_id": recipe.id}) if recipe.id else None
        if conflict or not recipe.id:
            recipe_id = f"rec_{uuid.uuid4().hex[:12]}"
        else:
            recipe_id = recipe.id

    doc = recipe.model_dump()
    doc["_id"] = recipe_id
    doc["user_id"] = user_id
    doc["created_at"] = now

    # Remove existing if overwriting
    await db.recipes.replace_one({"_id": recipe_id, "user_id": user_id}, doc, upsert=True)
    doc["id"] = recipe_id
    return RecipeSchema(**doc)


@router.get("/{recipe_id}", response_model=RecipeSchema)
async def get_recipe(recipe_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    user_id = str(current_user["_id"])
    doc = await db.recipes.find_one({"_id": recipe_id, "user_id": user_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "message": "Recipe not found.", "details": None}
        )
    doc["id"] = str(doc["_id"])
    return RecipeSchema(**doc)


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recipe(recipe_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    user_id = str(current_user["_id"])
    result = await db.recipes.delete_one({"_id": recipe_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "message": "Recipe not found.", "details": None}
        )

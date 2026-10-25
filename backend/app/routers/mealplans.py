import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.deps import get_current_user
from app.db.mongo import get_db
from app.services.ai.provider_factory import get_ai_provider
from app.services.allergy_validator import validate_meal_plan_allergies, check_ingredient_allergy_conflicts
from app.schemas.mealplan import (
    MealPlanGenerateRequest, MealPlanResponse, ReplaceMealRequest, MealItem
)

router = APIRouter(prefix="/mealplans", tags=["Personalized Meal Planner"])


@router.post("/generate", response_model=MealPlanResponse)
async def generate_meal_plan(
    payload: MealPlanGenerateRequest,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    provider = get_ai_provider()
    try:
        plan: MealPlanResponse = await provider.generate_meal_plan(payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "generation_failed", "message": f"Meal plan generation failed: {str(e)}", "details": None}
        )

    # Server-side allergy validation against declared allergies
    effective_allergies = payload.allergies
    if not effective_allergies:
        # Check user profile preferences if any
        pref = await db.preferences.find_one({"user_id": str(current_user["_id"])})
        if pref and pref.get("allergies"):
            effective_allergies = pref["allergies"]

    plan = validate_meal_plan_allergies(plan, effective_allergies)

    plan_id = f"mlp_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    plan.id = plan_id
    plan.created_at = now

    doc = plan.model_dump()
    doc["_id"] = plan_id
    doc["user_id"] = str(current_user["_id"])
    doc["request_params"] = payload.model_dump()

    await db.meal_plans.insert_one(doc)
    return plan


@router.get("", response_model=List[MealPlanResponse])
async def list_meal_plans(current_user=Depends(get_current_user), db=Depends(get_db)):
    user_id = str(current_user["_id"])
    cursor = db.meal_plans.find({"user_id": user_id}).sort("created_at", -1)
    results = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        results.append(MealPlanResponse(**doc))
    return results


@router.get("/{plan_id}", response_model=MealPlanResponse)
async def get_meal_plan(plan_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    user_id = str(current_user["_id"])
    doc = await db.meal_plans.find_one({"_id": plan_id, "user_id": user_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "message": "Meal plan not found.", "details": None}
        )
    doc["id"] = str(doc["_id"])
    return MealPlanResponse(**doc)


@router.post("/{plan_id}/replace-meal", response_model=MealPlanResponse)
async def replace_meal_in_plan(
    plan_id: str,
    payload: ReplaceMealRequest,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    user_id = str(current_user["_id"])
    plan_doc = await db.meal_plans.find_one({"_id": plan_id, "user_id": user_id})
    if not plan_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "message": "Meal plan not found.", "details": None}
        )

    provider = get_ai_provider()
    new_meal: MealItem = await provider.replace_meal(payload)

    # Validate allergy conflicts for new meal
    conflicts = check_ingredient_allergy_conflicts(new_meal.ingredients, payload.allergies or [])
    new_meal.allergy_flags = conflicts

    # Update the meal inside the plan
    daily_plans = plan_doc.get("daily_plans", [])
    found = False
    for day in daily_plans:
        if day["day"] == payload.day:
            for idx, meal in enumerate(day["meals"]):
                if meal["meal_type"].lower() == payload.meal_type.lower():
                    day["meals"][idx] = new_meal.model_dump()
                    found = True
                    break
            # Recalculate day nutrition
            day["daily_calories"] = sum(m["calories"] for m in day["meals"])
            day["daily_protein"] = round(sum(m["protein"] for m in day["meals"]), 1)
            day["daily_carbs"] = round(sum(m["carbs"] for m in day["meals"]), 1)
            day["daily_fats"] = round(sum(m["fats"] for m in day["meals"]), 1)
            break

    if not found:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "meal_not_found", "message": f"Meal '{payload.meal_type}' on day {payload.day} not found in this plan.", "details": None}
        )

    # Re-validate whole plan warnings
    temp_res = MealPlanResponse(**plan_doc)
    temp_res = validate_meal_plan_allergies(temp_res, payload.allergies or [])
    plan_doc["detected_allergy_warnings"] = temp_res.detected_allergy_warnings
    plan_doc["daily_plans"] = daily_plans

    await db.meal_plans.update_one(
        {"_id": plan_id},
        {"$set": {"daily_plans": daily_plans, "detected_allergy_warnings": temp_res.detected_allergy_warnings}}
    )

    plan_doc["id"] = plan_id
    return MealPlanResponse(**plan_doc)


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_meal_plan(plan_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    user_id = str(current_user["_id"])
    result = await db.meal_plans.delete_one({"_id": plan_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "message": "Meal plan not found.", "details": None}
        )

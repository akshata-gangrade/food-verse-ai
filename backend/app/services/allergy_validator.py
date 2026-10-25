from typing import List, Dict, Tuple
from app.schemas.mealplan import MealPlanResponse, MealItem


ALLERGEN_KEYWORDS: Dict[str, List[str]] = {
    "peanuts": ["peanut", "groundnut", "arachis", "peanut butter", "peanut oil"],
    "tree nuts": ["almond", "walnut", "cashew", "pecan", "pistachio", "hazelnut", "macadamia", "brazil nut", "praline"],
    "shellfish": ["shrimp", "prawn", "crab", "lobster", "clam", "mussel", "oyster", "scallop", "squid", "calamari", "octopus"],
    "dairy": ["milk", "cheese", "butter", "cream", "yogurt", "curd", "paneer", "whey", "casein", "ghee"],
    "milk": ["milk", "cheese", "butter", "cream", "yogurt", "curd", "paneer", "whey", "casein", "ghee"],
    "eggs": ["egg", "egg white", "egg yolk", "albumin", "mayonnaise", "meringue"],
    "fish": ["fish", "salmon", "tuna", "cod", "tilapia", "halibut", "sardine", "anchovy", "trout", "mackerel"],
    "wheat": ["wheat", "flour", "bread", "pasta", "semolina", "couscous", "bulgur", "spelt", "seitan"],
    "gluten": ["wheat", "barley", "rye", "malt", "brewer's yeast", "flour", "bread", "pasta", "couscous"],
    "soy": ["soy", "soya", "tofu", "tempeh", "edamame", "miso", "soy sauce", "tamari"],
    "sesame": ["sesame", "tahini", "sesame oil", "sesame seed"],
    "mustard": ["mustard", "mustard seed", "dijon"],
}


def check_ingredient_allergy_conflicts(ingredients: List[str], declared_allergies: List[str]) -> List[str]:
    """
    Checks a list of ingredients against declared allergies.
    Returns a list of conflict messages if any match.
    """
    conflicts = []
    if not declared_allergies:
        return conflicts

    normalized_allergies = [a.strip().lower() for a in declared_allergies if a.strip()]

    for item in ingredients:
        item_lower = item.lower()
        for allergy in normalized_allergies:
            # Direct match
            if allergy in item_lower:
                conflicts.append(f"Potential allergen '{allergy}' detected in '{item}'")
                continue

            # Keyword synonym match
            matched = False
            for group_name, keywords in ALLERGEN_KEYWORDS.items():
                if allergy in group_name or group_name in allergy:
                    for kw in keywords:
                        if kw in item_lower:
                            conflicts.append(f"Allergen warning: '{item}' contains '{kw}', related to declared allergy '{allergy}'")
                            matched = True
                            break
                if matched:
                    break

    return list(dict.fromkeys(conflicts))  # Remove duplicates preserving order


def validate_meal_plan_allergies(plan: MealPlanResponse, declared_allergies: List[str]) -> MealPlanResponse:
    """
    Server-side post-validation of the generated meal plan against declared allergies.
    Tags each meal's allergy_flags and appends to detected_allergy_warnings.
    """
    if not declared_allergies:
        return plan

    all_warnings = []

    for day in plan.daily_plans:
        for meal in day.meals:
            conflicts = check_ingredient_allergy_conflicts(meal.ingredients, declared_allergies)
            if conflicts:
                meal.allergy_flags = conflicts
                for c in conflicts:
                    warning_text = f"Day {day.day} - {meal.meal_type} ({meal.name}): {c}"
                    if warning_text not in all_warnings:
                        all_warnings.append(warning_text)

    plan.detected_allergy_warnings = all_warnings
    return plan

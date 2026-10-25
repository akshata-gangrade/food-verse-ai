import random
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any, Tuple
from app.services.ai.base import BaseAIProvider
from app.schemas.food import FoodAnalysisResponse, NutritionItem, TotalNutrition
from app.schemas.freshness import FreshnessAnalysisResponse
from app.schemas.hygiene import HygieneAnalysisResponse, HygieneFinding
from app.schemas.mealplan import (
    MealPlanGenerateRequest, MealPlanResponse, ReplaceMealRequest,
    DailyPlan, MealItem, GroceryItem
)
from app.schemas.chat import ChatMessage, RecipeSchema, RecipeStep


class DemoProvider(BaseAIProvider):
    async def analyze_food(
        self,
        images: List[Tuple[bytes, str]],
        note: Optional[str] = None
    ) -> FoodAnalysisResponse:
        # Realistic sample food analysis with rich macro & micronutrient estimates
        sample_options = [
            {
                "title": "Quinoa Power Buddha Bowl with Grilled Halloumi",
                "items": [
                    NutritionItem(name="Cooked Tricolor Quinoa", confidence=0.95, serving_size="1 cup (185g)", calories=222, protein=8.1, carbs=39.4, fats=3.6, fiber=5.2, sugar=1.6, sodium=13),
                    NutritionItem(name="Pan-Grilled Halloumi Cheese", confidence=0.92, serving_size="3 slices (75g)", calories=240, protein=16.0, carbs=1.5, fats=19.0, fiber=0.0, sugar=0.5, sodium=620),
                    NutritionItem(name="Roasted Chickpeas with Cumin", confidence=0.94, serving_size="1/2 cup (82g)", calories=135, protein=7.3, carbs=22.5, fats=2.1, fiber=6.2, sugar=4.0, sodium=190),
                    NutritionItem(name="Avocado Slices", confidence=0.96, serving_size="1/2 medium (75g)", calories=120, protein=1.5, carbs=6.5, fats=11.0, fiber=5.0, sugar=0.5, sodium=5),
                    NutritionItem(name="Tahini Lemon Dressing", confidence=0.87, serving_size="2 tbsp (30ml)", calories=110, protein=3.0, carbs=3.0, fats=10.0, fiber=1.0, sugar=0.2, sodium=115)
                ],
                "insights": [
                    "High fiber meal providing ~62% of standard daily fiber target.",
                    "Complete protein source combining quinoa and chickpeas.",
                    "Rich in healthy heart-friendly monounsaturated fats."
                ]
            },
            {
                "title": "Grilled Salmon with Steamed Asparagus & Wild Rice",
                "items": [
                    NutritionItem(name="Wild Alaskan Salmon Fillet", confidence=0.98, serving_size="6 oz (170g)", calories=310, protein=38.0, carbs=0.0, fats=16.5, fiber=0.0, sugar=0.0, sodium=95),
                    NutritionItem(name="Steamed Asparagus Spears", confidence=0.94, serving_size="1 cup (134g)", calories=27, protein=3.0, carbs=5.2, fats=0.2, fiber=2.8, sugar=2.5, sodium=3),
                    NutritionItem(name="Wild Rice Pilaf", confidence=0.91, serving_size="1 cup (164g)", calories=166, protein=6.5, carbs=35.0, fats=0.6, fiber=3.0, sugar=1.2, sodium=140),
                    NutritionItem(name="Herb Garlic Olive Oil Drizzle", confidence=0.85, serving_size="1 tbsp (15ml)", calories=120, protein=0.0, carbs=0.2, fats=13.5, fiber=0.0, sugar=0.0, sodium=45)
                ],
                "insights": [
                    "Exceptional lean protein content with over 47g per serving.",
                    "High in Omega-3 fatty acids EPA & DHA for brain and cardiovascular health.",
                    "Low glycemic index supporting stable blood glucose."
                ]
            }
        ]

        selection = sample_options[0] if (len(images) % 2 == 1) else sample_options[1]
        
        # Calculate totals dynamically
        total_cals = sum(i.calories for i in selection["items"])
        total_pro = sum(i.protein for i in selection["items"])
        total_carb = sum(i.carbs for i in selection["items"])
        total_fat = sum(i.fats for i in selection["items"])
        total_fib = sum(i.fiber for i in selection["items"])
        total_sug = sum(i.sugar for i in selection["items"])
        total_sod = sum(i.sodium for i in selection["items"])

        pro_cal = total_pro * 4
        carb_cal = total_carb * 4
        fat_cal = total_fat * 9
        sum_macro_cals = pro_cal + carb_cal + fat_cal or 1

        return FoodAnalysisResponse(
            title=selection["title"],
            identified_items=selection["items"],
            total_nutrition=TotalNutrition(
                calories=round(total_cals, 1),
                protein=round(total_pro, 1),
                carbs=round(total_carb, 1),
                fats=round(total_fat, 1),
                fiber=round(total_fib, 1),
                sugar=round(total_sug, 1),
                sodium=round(total_sod, 1)
            ),
            macro_percentages={
                "protein": round((pro_cal / sum_macro_cals) * 100, 1),
                "carbs": round((carb_cal / sum_macro_cals) * 100, 1),
                "fats": round((fat_cal / sum_macro_cals) * 100, 1)
            },
            insights=selection["insights"],
            source="demo_sample",
            disclaimer="Values are AI estimates and may differ from actual content."
        )

    async def analyze_freshness(
        self,
        media_bytes: bytes,
        mime_type: str,
        note: Optional[str] = None
    ) -> FreshnessAnalysisResponse:
        return FreshnessAnalysisResponse(
            title="Freshness Evaluation – Produce Inspection",
            visual_indicator="Some signs of aging",
            confidence=0.89,
            observations=[
                "Slight surface dehydration and localized skin wrinkling visible along outer edges.",
                "Natural color retention remains intact with minor browning around stem attachments.",
                "No visible presence of fuzzy fungal mycelium or deep soft rot pockets.",
                "Surface firmness appears slightly reduced compared to prime fresh harvest."
            ],
            estimated_shelf_life="Best consumed within 2 to 3 days if refrigerated properly.",
            storage_recommendations=[
                "Transfer immediately to a cool crisper drawer (36°F - 40°F / 2°C - 4°C).",
                "Keep unwashed until directly prior to consumption to prevent moisture buildup.",
                "Store away from high-ethylene producers like ripening bananas and melons.",
                "Caution: When in doubt, throw it out."
            ],
            source="demo_sample",
            disclaimer="Visual assessment only. It cannot detect bacteria, toxins, or contamination and cannot guarantee food safety."
        )

    async def analyze_hygiene(
        self,
        media_bytes: bytes,
        mime_type: str,
        note: Optional[str] = None
    ) -> HygieneAnalysisResponse:
        return HygieneAnalysisResponse(
            title="Commercial Food Prep Area Inspection",
            visual_risk_score=28,
            risk_level="Low Risk",
            findings=[
                HygieneFinding(
                    category="surfaces",
                    severity="low",
                    evidence="Stainless steel cutting and prep countertops appear wiped down with no heavy accumulation.",
                    corrective_action="Maintain scheduled sanitizing wipe-downs with approved quaternary ammonium solution every 4 hours."
                ),
                HygieneFinding(
                    category="food storage",
                    severity="medium",
                    evidence="Secondary ingredient container on lower shelf lacks an identifiable dated day-dot label.",
                    corrective_action="Affix legible day labels noting prep date, time, and expiration before storing in walk-in units."
                ),
                HygieneFinding(
                    category="cross-contamination risk",
                    severity="low",
                    evidence="Color-coded cutting boards are segregated on vertical drying racks.",
                    corrective_action="Ensure raw protein utensils remain strictly separated from ready-to-eat produce tools."
                ),
                HygieneFinding(
                    category="waste handling",
                    severity="low",
                    evidence="Waste receptacle is foot-pedal operated and not overflowing.",
                    corrective_action="Ensure interior liner is replaced before reaching 3/4 capacity."
                )
            ],
            summary_report="Visual inspection of the preparation environment demonstrates good adherence to commercial kitchen hygiene standards. Clean countertops and organized storage observed. Primary corrective priority is strict container dating protocols.",
            source="demo_sample",
            disclaimer="Based on visible conditions in the image. Not an official inspection or certification."
        )

    async def generate_chat_reply(
        self,
        history: List[ChatMessage],
        latest_message: str,
        image_bytes: Optional[bytes] = None,
        image_mime: Optional[str] = None,
        audio_bytes: Optional[bytes] = None,
        audio_mime: Optional[str] = None
    ) -> Dict[str, Any]:
        msg_lower = latest_message.lower()

        # Check if user requested a recipe
        if any(w in msg_lower for w in ["recipe", "make", "cook", "prepare", "dinner", "breakfast", "curry", "soup", "pasta"]):
            recipe = RecipeSchema(
                title="Fragrant Coconut Lime Chickpea Curry",
                cuisine="South Asian Fusion",
                prep_time_minutes=15,
                cook_time_minutes=20,
                servings=4,
                calories_per_serving=385,
                macros={"protein": 14.0, "carbs": 48.0, "fats": 16.5},
                ingredients=[
                    "2 cans (15 oz each) chickpeas, rinsed and drained",
                    "1 can (13.5 oz) full-fat coconut milk",
                    "1 medium red onion, finely diced",
                    "3 cloves garlic, minced",
                    "1 tbsp fresh ginger, grated",
                    "1 tbsp curry powder & 1 tsp ground cumin",
                    "2 cups fresh baby spinach leaves",
                    "1 lime, juiced",
                    "1 tbsp olive or coconut oil",
                    "Sea salt and freshly ground pepper to taste"
                ],
                instructions=[
                    RecipeStep(step_number=1, text="Heat 1 tbsp oil in a large deep skillet over medium heat.", timer_seconds=60),
                    RecipeStep(step_number=2, text="Add diced onion, minced garlic, and ginger. Sauté until fragrant and translucent.", timer_seconds=240),
                    RecipeStep(step_number=3, text="Stir in curry powder, cumin, salt, and pepper. Toast the spices for 1 minute until fragrant.", timer_seconds=60),
                    RecipeStep(step_number=4, text="Pour in coconut milk and rinsed chickpeas. Bring to a gentle simmer for 10-12 minutes to thicken.", timer_seconds=720),
                    RecipeStep(step_number=5, text="Stir in fresh baby spinach and fresh lime juice until greens are just wilted. Serve hot with jasmine rice or naan.", timer_seconds=120)
                ],
                substitutions=[
                    "Replace chickpeas with cubed extra-firm tofu, paneer, or chicken breast.",
                    "Use light coconut milk or almond milk whisked with cornstarch for lower fat.",
                    "Swap spinach for chopped kale or baby bok choy."
                ],
                source="demo_sample"
            )
            return {
                "reply": "Here is a fragrant, nutrient-packed Coconut Lime Chickpea Curry recipe! It features hearty legumes, warming spices, and vibrant greens. You can click 'Start Guided Cooking' below for step-by-step guidance with built-in timers, or 'Save Recipe' to add it to your collection.",
                "recipe": recipe
            }

        # Conversational assistance
        return {
            "reply": f"As your culinary intelligence assistant, I'm here to help with techniques, recipe creations, ingredient substitutions, and safety tips! In demo mode, I can demonstrate complete cooking workflows, timers, and recipe generation. What ingredients do you have in your kitchen today?",
            "recipe": None
        }

    async def generate_meal_plan(
        self,
        request: MealPlanGenerateRequest
    ) -> MealPlanResponse:
        days = request.days
        diet = request.diet_type
        target_cals = request.target_calories
        target_pro = request.macro_targets.get("protein", 120) if request.macro_targets else 120

        daily_plans: List[DailyPlan] = []
        days_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

        base_meals = [
            # Day 1
            [
                MealItem(meal_type="Breakfast", name="Overnight Oats with Chia, Berries & Almond Butter", description="Creamy rolled oats soaked in oat milk, layered with fresh blueberries and almond butter.", ingredients=["Rolled oats", "Chia seeds", "Almond milk", "Blueberries", "Almond butter"], calories=420, protein=14.0, carbs=58.0, fats=16.0, prep_time="5 mins"),
                MealItem(meal_type="Lunch", name="Mediterranean Quinoa Tabbouleh Bowl with Grilled Chicken", description="Fluffy quinoa tossed with cucumber, cherry tomatoes, mint, and tender herb chicken.", ingredients=["Quinoa", "Chicken breast", "Cucumber", "Cherry tomatoes", "Fresh mint", "Olive oil", "Lemon juice"], calories=620, protein=46.0, carbs=52.0, fats=24.0, prep_time="20 mins"),
                MealItem(meal_type="Dinner", name="Baked Herb-Crusted Salmon with Roasted Asparagus & Sweet Potato", description="Wild salmon fillet crusted with dill and garlic, served with caramelized sweet potato wedges.", ingredients=["Salmon fillet", "Sweet potato", "Asparagus", "Dill", "Garlic", "Olive oil"], calories=680, protein=44.0, carbs=54.0, fats=28.0, prep_time="30 mins"),
            ],
            # Day 2
            [
                MealItem(meal_type="Breakfast", name="Avocado Green Smoothie & Soft-Boiled Pasture Eggs", description="Spinach, avocado, banana, and hemp protein smoothie paired with two boiled eggs.", ingredients=["Avocado", "Spinach", "Banana", "Hemp protein", "Eggs"], calories=460, protein=22.0, carbs=38.0, fats=24.0, prep_time="10 mins"),
                MealItem(meal_type="Lunch", name="Warm Lentil Salad with Goat Cheese & Walnuts", description="French green lentils with roasted red peppers, crumbled goat cheese, and toasted walnuts.", ingredients=["Green lentils", "Goat cheese", "Walnuts", "Red bell pepper", "Dijon vinaigrette"], calories=580, protein=26.0, carbs=48.0, fats=28.0, prep_time="25 mins"),
                MealItem(meal_type="Dinner", name="Turkey & Sweet Potato Skillet with Tuscan Kale", description="Lean ground turkey browned with cubed sweet potato, garlic, and ribbons of Tuscan kale.", ingredients=["Ground turkey", "Sweet potato", "Tuscan kale", "Garlic", "Avocado oil"], calories=640, protein=45.0, carbs=50.0, fats=22.0, prep_time="25 mins"),
            ],
            # Day 3
            [
                MealItem(meal_type="Breakfast", name="Greek Yogurt Parfait with Pumpkin Seeds & Raw Honey", description="Strained whole milk Greek yogurt topped with toasted pumpkin seeds and wildflower honey.", ingredients=["Greek yogurt", "Pumpkin seeds", "Honey", "Strawberries"], calories=390, protein=25.0, carbs=36.0, fats=14.0, prep_time="5 mins"),
                MealItem(meal_type="Lunch", name="Spiced Chickpea & Hummus Wrap in Whole Wheat", description="Crispy spiced chickpeas, creamy garlic hummus, crunchy romaine, and cucumber in a wrap.", ingredients=["Whole wheat flatbread", "Chickpeas", "Hummus", "Romaine lettuce", "Cucumber"], calories=540, protein=20.0, carbs=68.0, fats=20.0, prep_time="15 mins"),
                MealItem(meal_type="Dinner", name="Pan-Seared Cod in Rustic Tomato & Caper Sauce", description="Delicate cod simmered in crushed San Marzano tomatoes, capers, kalamata olives, and fresh basil.", ingredients=["Cod fillets", "Crushed tomatoes", "Capers", "Kalamata olives", "Fresh basil", "Brown rice"], calories=590, protein=42.0, carbs=58.0, fats=18.0, prep_time="25 mins"),
            ],
            # Day 4
            [
                MealItem(meal_type="Breakfast", name="Shakshuka with Feta and Crusty Sourdough", description="Eggs poached in a simmering spiced bell pepper and tomato stew with crumbled feta.", ingredients=["Eggs", "Bell peppers", "Crushed tomatoes", "Feta cheese", "Sourdough toast"], calories=440, protein=21.0, carbs=40.0, fats=20.0, prep_time="20 mins"),
                MealItem(meal_type="Lunch", name="Crispy Tofu Soba Noodle Bowl with Edamame", description="Buckwheat soba noodles, golden tofu cubes, edamame, and shredded red cabbage in sesame tamari.", ingredients=["Soba noodles", "Firm tofu", "Edamame", "Red cabbage", "Sesame oil", "Tamari"], calories=590, protein=28.0, carbs=64.0, fats=22.0, prep_time="20 mins"),
                MealItem(meal_type="Dinner", name="Grass-Fed Beef Stir-Fry with Broccoli & Jasmine Brown Rice", description="Tender beef strips flashed with crisp broccoli florets and ginger in light coconut aminos.", ingredients=["Lean beef strips", "Broccoli", "Ginger", "Garlic", "Brown jasmine rice"], calories=650, protein=46.0, carbs=52.0, fats=24.0, prep_time="25 mins"),
            ],
            # Day 5
            [
                MealItem(meal_type="Breakfast", name="Fluffy Cottage Cheese Protein Pancakes with Maple Berries", description="Light grain-free pancakes blended with cottage cheese and oats, topped with warm berries.", ingredients=["Rolled oats", "Cottage cheese", "Eggs", "Mixed berries", "Pure maple syrup"], calories=430, protein=28.0, carbs=48.0, fats=12.0, prep_time="15 mins"),
                MealItem(meal_type="Lunch", name="Mediterranean Tuna & White Bean Salad", description="Flaked pole-caught tuna tossed with creamy cannellini beans, celery, red onion, and lemon olive oil.", ingredients=["Albacore tuna", "Cannellini beans", "Celery", "Red onion", "Lemon", "Olive oil"], calories=560, protein=42.0, carbs=38.0, fats=22.0, prep_time="10 mins"),
                MealItem(meal_type="Dinner", name="Roasted Lemon Herb Half Chicken with Zucchini Medley", description="Crispy skin chicken roasted with fresh rosemary, served with sautéed yellow squash and zucchini.", ingredients=["Chicken breast/thigh", "Rosemary", "Zucchini", "Yellow squash", "Olive oil"], calories=660, protein=50.0, carbs=22.0, fats=38.0, prep_time="35 mins"),
            ],
            # Day 6
            [
                MealItem(meal_type="Breakfast", name="Smoked Salmon Everything Bagel Toast", description="Sprouted grain bread with whipped chive cream cheese, wild smoked salmon, and capers.", ingredients=["Sprouted bread", "Cream cheese", "Smoked salmon", "Capers", "Everything seasoning"], calories=410, protein=24.0, carbs=36.0, fats=18.0, prep_time="5 mins"),
                MealItem(meal_type="Lunch", name="Moroccan Spiced Carrot & Lentil Soup with Pita", description="Velvety soup with roasted carrots, red lentils, coriander, and warm whole grain pita wedges.", ingredients=["Red lentils", "Carrots", "Coriander", "Cumin", "Whole wheat pita"], calories=520, protein=22.0, carbs=74.0, fats=12.0, prep_time="30 mins"),
                MealItem(meal_type="Dinner", name="Grilled Shrimp Skewers with Lemon Herb Orzo", description="Marinated jumbo shrimp charred on skewers alongside whole wheat orzo with spinach and sun-dried tomatoes.", ingredients=["Jumbo shrimp", "Whole wheat orzo", "Baby spinach", "Sun-dried tomatoes", "Lemon"], calories=610, protein=42.0, carbs=58.0, fats=18.0, prep_time="25 mins"),
            ],
            # Day 7
            [
                MealItem(meal_type="Breakfast", name="Vegetable Frittata with Roasted Red Potatoes", description="Baked egg frittata with mushrooms, leeks, and goat cheese alongside crispy potato cubes.", ingredients=["Eggs", "Mushrooms", "Leeks", "Goat cheese", "Baby red potatoes"], calories=450, protein=22.0, carbs=38.0, fats=22.0, prep_time="25 mins"),
                MealItem(meal_type="Lunch", name="Chipotle Chicken Fajita Burrito Bowl", description="Grilled spiced chicken breast, black beans, fajita peppers, salsa fresca, and guacamole.", ingredients=["Chicken breast", "Black beans", "Bell peppers", "Salsa", "Avocado"], calories=620, protein=46.0, carbs=52.0, fats=22.0, prep_time="20 mins"),
                MealItem(meal_type="Dinner", name="Creamy Butternut Squash Ravioli with Crispy Sage", description="Fresh squash ravioli in a light browned butter and sage reduction with roasted pine nuts.", ingredients=["Butternut squash ravioli", "Butter", "Fresh sage", "Pine nuts", "Parmesan"], calories=640, protein=18.0, carbs=76.0, fats=28.0, prep_time="20 mins"),
            ]
        ]

        for d in range(days):
            day_num = d + 1
            meals_list = base_meals[d % len(base_meals)]
            
            # If request specified 2 or 4 meals per day, adapt accordingly
            if request.meals_per_day == 2:
                meals_list = meals_list[:2]
            elif request.meals_per_day >= 4:
                snack = MealItem(
                    meal_type="Snack",
                    name="Apple Slices with Natural Peanut Butter",
                    description="Crisp Honeycrisp apple wedges with unsweetened peanut butter.",
                    ingredients=["Apple", "Peanut butter"],
                    calories=220,
                    protein=6.0,
                    carbs=26.0,
                    fats=12.0,
                    prep_time="3 mins"
                )
                meals_list = meals_list + [snack]

            tot_cals = sum(m.calories for m in meals_list)
            tot_pro = sum(m.protein for m in meals_list)
            tot_carb = sum(m.carbs for m in meals_list)
            tot_fat = sum(m.fats for m in meals_list)

            daily_plans.append(DailyPlan(
                day=day_num,
                day_name=days_names[d % 7],
                meals=meals_list,
                daily_calories=tot_cals,
                daily_protein=round(tot_pro, 1),
                daily_carbs=round(tot_carb, 1),
                daily_fats=round(tot_fat, 1)
            ))

        # Consolidated grocery list grouped by category
        grocery_list = [
            GroceryItem(name="Rolled oats", quantity="1 bag (500g)", category="Pantry"),
            GroceryItem(name="Tricolor quinoa", quantity="1 bag (400g)", category="Pantry"),
            GroceryItem(name="Canned chickpeas & black beans", quantity="4 cans", category="Pantry"),
            GroceryItem(name="Extra virgin olive oil", quantity="1 bottle (500ml)", category="Pantry"),
            GroceryItem(name="Baby spinach & Tuscan kale", quantity="2 large tubs", category="Produce"),
            GroceryItem(name="Hass avocados", quantity="4 medium", category="Produce"),
            GroceryItem(name="Sweet potatoes & Red bell peppers", quantity="4 each", category="Produce"),
            GroceryItem(name="Lemons & Limes", quantity="6 whole", category="Produce"),
            GroceryItem(name="Pasture-raised eggs", quantity="2 cartons (24 eggs)", category="Dairy & Refrigerated"),
            GroceryItem(name="Greek yogurt (unsweetened)", quantity="1 tub (750g)", category="Dairy & Refrigerated"),
            GroceryItem(name="Feta & Goat cheese", quantity="2 packs (150g each)", category="Dairy & Refrigerated"),
            GroceryItem(name="Boneless skinless chicken breast", quantity="1.2 kg", category="Proteins"),
            GroceryItem(name="Fresh wild salmon fillets", quantity="4 fillets (600g)", category="Proteins"),
            GroceryItem(name="Lean ground turkey", quantity="500g", category="Proteins"),
            GroceryItem(name="Dried oregano, cumin, sea salt", quantity="1 spice jar set", category="Spices & Seasonings")
        ]

        return MealPlanResponse(
            title=f"{diet} Nutrition Plan ({days} Days)",
            days_count=days,
            daily_plans=daily_plans,
            grocery_list=grocery_list,
            detected_allergy_warnings=[],
            source="demo_sample",
            disclaimer="General guidance, not medical advice. Consult a professional for medical conditions or severe allergies."
        )

    async def replace_meal(
        self,
        request: ReplaceMealRequest
    ) -> MealItem:
        alternatives = [
            MealItem(
                meal_type=request.meal_type,
                name="Herb-Roasted Turkey Breast with Lemon Quinoa",
                description="Sliced roasted turkey paired with fluffy warm citrus quinoa and baby greens.",
                ingredients=["Turkey breast", "Quinoa", "Lemon", "Mixed baby greens", "Olive oil"],
                calories=520,
                protein=42.0,
                carbs=46.0,
                fats=16.0,
                prep_time="20 mins"
            ),
            MealItem(
                meal_type=request.meal_type,
                name="Spiced Black Bean and Avocado Rice Bowl",
                description="Simmered black beans with roasted corn, cumin, brown rice, and ripe avocado.",
                ingredients=["Black beans", "Corn", "Brown rice", "Avocado", "Cilantro", "Lime"],
                calories=490,
                protein=18.0,
                carbs=68.0,
                fats=16.0,
                prep_time="15 mins"
            ),
            MealItem(
                meal_type=request.meal_type,
                name="Seared Atlantic Cod with Mediterranean Caponata",
                description="Pan-seared cod served over sautéed eggplant, tomato, and olive caponata.",
                ingredients=["Cod fillet", "Eggplant", "Tomatoes", "Olives", "Garlic", "Basil"],
                calories=440,
                protein=38.0,
                carbs=24.0,
                fats=18.0,
                prep_time="25 mins"
            )
        ]
        return random.choice(alternatives)

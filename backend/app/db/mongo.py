import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient
import mongomock_motor
from app.core.config import get_settings
from app.core.security import hash_password

try:
    import dns.resolver
    _default_resolver = dns.resolver.get_default_resolver()
    for ns in ["8.8.8.8", "1.1.1.1"]:
        if ns not in _default_resolver.nameservers:
            _default_resolver.nameservers.insert(0, ns)
    _default_resolver.lifetime = 10.0
except Exception:
    pass

logger = logging.getLogger("aahaar.db")

settings = get_settings()


class DatabaseManager:
    client: Optional[Any] = None
    db: Optional[Any] = None
    is_in_memory: bool = False

    async def connect(self):
        """Attempts connection to real MongoDB Atlas; raises error in production mode or falls back in demo mode."""
        current_settings = get_settings()
        host_part = current_settings.MONGODB_URL.split('@')[-1].split('/')[0] if '@' in current_settings.MONGODB_URL else "localhost"
        try:
            logger.info(f"Connecting to MongoDB Atlas at {host_part} (database: {current_settings.DATABASE_NAME})...")
            real_client = AsyncIOMotorClient(
                current_settings.MONGODB_URL,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000
            )
            # Ping to verify server availability
            await real_client.admin.command("ping")
            self.client = real_client
            self.db = real_client[current_settings.DATABASE_NAME]
            self.is_in_memory = False
            logger.info("Successfully connected to MongoDB Atlas.")
        except Exception as e:
            if current_settings.DEMO_MODE:
                logger.warning(f"MongoDB Atlas connection failed: {e}. DEMO_MODE=true: Switching to in-memory mongomock fallback.")
                mock_client = mongomock_motor.AsyncMongoMockClient()
                self.client = mock_client
                self.db = mock_client[current_settings.DATABASE_NAME]
                self.is_in_memory = True
                logger.info("Initialized in-memory database fallback (mongomock-motor).")
            else:
                logger.error(f"MongoDB Atlas connection failed: {e}. DEMO_MODE=false: Silent in-memory fallback disabled.")
                raise RuntimeError(
                    f"MongoDB Atlas connection failed: {e}. In real database mode, silent fallback to in-memory storage is disabled."
                )

        await self.init_db()

    async def init_db(self):
        """Create collections, indexes and seed initial demo data if needed."""
        if self.db is None:
            return

        try:
            # Ensure all application collections exist
            existing_cols = await self.db.list_collection_names()
            app_collections = ["users", "preferences", "analyses", "recipes", "meal_plans", "chat_sessions"]
            for col in app_collections:
                if col not in existing_cols:
                    await self.db.create_collection(col)
                    logger.info(f"Created collection '{col}' in database.")

            # Create indexes
            await self.db.users.create_index("email", unique=True)
            await self.db.preferences.create_index("user_id", unique=True)
            await self.db.analyses.create_index([("user_id", 1), ("created_at", -1)])
            await self.db.recipes.create_index([("user_id", 1), ("created_at", -1)])
            await self.db.meal_plans.create_index([("user_id", 1), ("created_at", -1)])
            await self.db.chat_sessions.create_index([("user_id", 1), ("updated_at", -1)])
        except Exception as e:
            logger.warning(f"Index creation note: {e}")

        # Seed Demo User
        demo_email = "demo@aahaar.ai"
        demo_user = await self.db.users.find_one({"email": demo_email})
        demo_user_id = "usr_demo_aahaar_01"
        now = datetime.now(timezone.utc)

        if not demo_user:
            hashed_pw = hash_password("Demo@12345")
            await self.db.users.insert_one({
                "_id": demo_user_id,
                "email": demo_email,
                "full_name": "Demo Gourmet",
                "hashed_password": hashed_pw,
                "is_active": True,
                "is_demo_account": True,
                "created_at": now.isoformat(),
            })
            logger.info("Seeded demo user demo@aahaar.ai / Demo@12345")

            # Seed demo preferences
            await self.db.preferences.insert_one({
                "user_id": demo_user_id,
                "diet_type": "Balanced Mediterranean",
                "allergies": ["Peanuts", "Shellfish"],
                "cuisine_preferences": ["Indian", "Mediterranean", "Japanese"],
                "daily_calorie_target": 2100,
                "macro_targets": {"protein": 125, "carbs": 235, "fats": 65},
                "health_goals": ["Build lean muscle", "Maintain cardiovascular health"],
                "updated_at": now.isoformat(),
            })

            # Seed sample analyses for Demo user
            sample_analyses = [
                {
                    "_id": "ana_sample_01",
                    "user_id": demo_user_id,
                    "feature": "food",
                    "title": "Avocado & Poached Egg Protein Sourdough",
                    "created_at": (now - timedelta(hours=3)).isoformat(),
                    "source": "demo_sample",
                    "input_type": "image",
                    "summary": "Nutritious breakfast with healthy fats and lean protein.",
                    "data": {
                        "identified_items": [
                            {"name": "Whole Wheat Sourdough Toast", "confidence": 0.96, "serving_size": "2 slices (70g)", "calories": 180, "protein": 7.0, "carbs": 34.0, "fats": 1.5, "fiber": 4.0, "sugar": 1.0, "sodium": 320},
                            {"name": "Hass Avocado Mashed", "confidence": 0.94, "serving_size": "1/2 medium (75g)", "calories": 120, "protein": 1.5, "carbs": 6.5, "fats": 11.0, "fiber": 5.0, "sugar": 0.5, "sodium": 5},
                            {"name": "Poached Free-Range Eggs", "confidence": 0.98, "serving_size": "2 large (100g)", "calories": 144, "protein": 12.6, "carbs": 0.8, "fats": 9.9, "fiber": 0.0, "sugar": 0.4, "sodium": 142},
                            {"name": "Microgreens & Sesame Garnish", "confidence": 0.88, "serving_size": "1 tbsp (10g)", "calories": 18, "protein": 0.6, "carbs": 0.9, "fats": 1.4, "fiber": 0.5, "sugar": 0.1, "sodium": 2}
                        ],
                        "total_nutrition": {
                            "calories": 462,
                            "protein": 21.7,
                            "carbs": 42.2,
                            "fats": 23.8,
                            "fiber": 9.5,
                            "sugar": 2.0,
                            "sodium": 469
                        },
                        "macro_percentages": {
                            "protein": 19,
                            "carbs": 36,
                            "fats": 45
                        },
                        "insights": [
                            "Excellent fiber intake (38% of daily recommended value).",
                            "High in monounsaturated fats supporting heart health.",
                            "Quality complete protein from eggs."
                        ],
                        "disclaimer": "Values are AI estimates and may differ from actual content."
                    }
                },
                {
                    "_id": "ana_sample_02",
                    "user_id": demo_user_id,
                    "feature": "freshness",
                    "title": "Fresh Gala Apples & Cavendish Bananas",
                    "created_at": (now - timedelta(days=1, hours=2)).isoformat(),
                    "source": "demo_sample",
                    "input_type": "image",
                    "summary": "Apples show peak crispness; bananas have light sugar spotting (ideal for consumption).",
                    "data": {
                        "visual_indicator": "Looks fresh",
                        "confidence": 0.92,
                        "observations": [
                            "Skin tautness on apples indicates good moisture retention.",
                            "Bananas display minor brown sugar spots indicating peak ripeness and sweetness.",
                            "No signs of deep bruising, fungal mycelium, or skin breakdown."
                        ],
                        "estimated_shelf_life": "3 - 5 days at room temperature for bananas, 2 weeks refrigerated for apples",
                        "storage_recommendations": [
                            "Separate bananas from other fruits to prevent accelerated ripening via ethylene gas.",
                            "Store apples in crisper drawer at 32-35°F (0-2°C) with high humidity.",
                            "When in doubt, throw it out."
                        ],
                        "disclaimer": "Visual assessment only. It cannot detect bacteria, toxins, or contamination and cannot guarantee food safety."
                    }
                },
                {
                    "_id": "ana_sample_03",
                    "user_id": demo_user_id,
                    "feature": "hygiene",
                    "title": "Commercial Prep Counter & Sanitization Station",
                    "created_at": (now - timedelta(days=2)).isoformat(),
                    "source": "demo_sample",
                    "input_type": "image",
                    "summary": "Overall good hygiene standards with minor storage placement observation.",
                    "data": {
                        "visual_risk_score": 18,
                        "risk_level": "Low Risk",
                        "findings": [
                            {
                                "category": "surfaces",
                                "severity": "low",
                                "evidence": "Stainless steel preparation surfaces appear sanitized with no visible residue.",
                                "corrective_action": "Maintain 4-hour sanitization interval logging."
                            },
                            {
                                "category": "food storage",
                                "severity": "medium",
                                "evidence": "Uncovered container of prepped herbs observed on mid shelf without date label.",
                                "corrective_action": "Cover all prepped containers with airtight lids and apply day-dots with prep date/time."
                            },
                            {
                                "category": "PPE and attire",
                                "severity": "low",
                                "evidence": "Staff visible wearing proper hair restraints and clean aprons.",
                                "corrective_action": "Ensure glove-changing protocol is strictly observed between tasks."
                            }
                        ],
                        "summary_report": "The kitchen inspection reveals high compliance with sanitation standards. Food prep counters are clean and organized. Main corrective action is ensuring 100% labeling and sealing of prepped herbs in line with HACCP guidelines.",
                        "disclaimer": "Based on visible conditions in the image. Not an official inspection or certification."
                    }
                }
            ]
            await self.db.analyses.insert_many(sample_analyses)

            # Seed sample recipe
            sample_recipe = {
                "_id": "rec_sample_01",
                "user_id": demo_user_id,
                "title": "Pan-Seared Mediterranean Salmon Bowl",
                "cuisine": "Mediterranean",
                "prep_time_minutes": 15,
                "cook_time_minutes": 15,
                "servings": 2,
                "calories_per_serving": 520,
                "macros": {"protein": 42, "carbs": 35, "fats": 22},
                "ingredients": [
                    "2 Atlantic salmon fillets (150g each)",
                    "1 cup cooked quinoa",
                    "1 cup baby spinach",
                    "1/2 cucumber, sliced",
                    "1/4 cup Kalamata olives",
                    "2 tbsp extra virgin olive oil",
                    "1 lemon, juiced",
                    "1 tsp dried oregano, salt & black pepper"
                ],
                "instructions": [
                    {"step_number": 1, "text": "Season salmon fillets with dried oregano, sea salt, black pepper, and half the lemon juice.", "timer_seconds": 0},
                    {"step_number": 2, "text": "Heat 1 tbsp olive oil in a skillet over medium-high heat. Add salmon skin-side down and cook for 4-5 minutes until crisp.", "timer_seconds": 300},
                    {"step_number": 3, "text": "Flip carefully and sear the other side for 3-4 minutes until cooked through.", "timer_seconds": 240},
                    {"step_number": 4, "text": "In two bowls, divide cooked quinoa, fresh baby spinach, sliced cucumber, and olives.", "timer_seconds": 0},
                    {"step_number": 5, "text": "Top with seared salmon fillets, drizzle with remaining olive oil and lemon juice, and serve warm.", "timer_seconds": 0}
                ],
                "substitutions": [
                    "Replace salmon with firm tofu or chicken breast if desired.",
                    "Swap quinoa with brown rice or cauliflower rice for low-carb option."
                ],
                "source": "demo_sample",
                "created_at": now.isoformat()
            }
            await self.db.recipes.insert_one(sample_recipe)

            logger.info("Demo user seed data successfully initialized.")

    async def close(self):
        if self.client:
            self.client.close()


db_manager = DatabaseManager()


def get_db():
    return db_manager.db


def is_in_memory_db() -> bool:
    return db_manager.is_in_memory

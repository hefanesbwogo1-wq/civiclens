import json
import os
import re
import urllib.error
import urllib.request

from fastapi import APIRouter
from pydantic import BaseModel, EmailStr, Field

# =========================================================
# CIVICLENS AUTHENTICATION ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


# =========================================================
# ENVIRONMENT CONFIGURATION
# =========================================================

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "").strip()


# =========================================================
# REGISTRATION REQUEST MODEL
# =========================================================

class RegistrationRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=20)
    organization: str = Field(min_length=2, max_length=150)
    role: str = Field(min_length=2, max_length=100)
    password: str = Field(min_length=8, max_length=128)
    subscription_plan: str
    accept_terms: bool


# =========================================================
# CREATE USER IN SUPABASE AUTH
# =========================================================

def create_supabase_user(data: RegistrationRequest):

    if not SUPABASE_URL:
        print("Supabase signup failed: URL is not configured.")

        return {
            "success": False,
            "message": "Supabase URL is not configured."
        }

    if not SUPABASE_ANON_KEY:
        print("Supabase signup failed: authentication key is not configured.")

        return {
            "success": False,
            "message": "Supabase authentication key is not configured."
        }

    url = f"{SUPABASE_URL}/auth/v1/signup"

    payload = {
        "email": data.email.lower().strip(),
        "password": data.password,
        "data": {
            "full_name": data.full_name.strip(),
            "phone": data.phone.strip(),
            "organization": data.organization.strip(),
            "role": data.role.strip(),
            "subscription_plan": data.subscription_plan
        }
    }

    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
        },
        method="POST"
    )

    try:

        with urllib.request.urlopen(request, timeout=20) as response:

            response_body = response.read().decode(
                "utf-8",
                errors="replace"
            )

            print(
                "Supabase signup HTTP status:",
                response.status
            )

            print("Supabase signup response received.")

            try:
                result = json.loads(response_body)

            except json.JSONDecodeError:

                print(
                    "Supabase returned a non-JSON response."
                )

                return {
                    "success": False,
                    "message": "Supabase returned an unexpected response."
                }

            # -------------------------------------------------
            # IMPORTANT:
            # When email confirmation is enabled,
            # Supabase may return a USER but no SESSION.
            # That is normal.
            # -------------------------------------------------

            user = result.get("user")

            if user:

                print(
                    "Supabase user created successfully."
                )

                return {
                    "success": True,
                    "data": result
                }

            # Safe diagnostic: print only response keys,
            # never tokens, passwords, or sensitive data.
            print(
                "Supabase response keys:",
                list(result.keys())
            )

            return {
                "success": False,
                "message": (
                    "Supabase did not return a user account. "
                    "Please check the Supabase Authentication settings."
                )
            }

    except urllib.error.HTTPError as error:

        error_body = error.read().decode(
            "utf-8",
            errors="replace"
        )

        try:
            error_data = json.loads(error_body)

        except Exception:
            error_data = {}

        message = (
            error_data.get("msg")
            or error_data.get("message")
            or error_data.get("error_description")
            or "Supabase registration failed."
        )

        print(
            "Supabase signup failed:",
            error.code,
            message
        )

        return {
            "success": False,
            "message": message
        }

    except urllib.error.URLError as error:

        print(
            "Supabase connection error:",
            error.reason
        )

        return {
            "success": False,
            "message": (
                "Unable to connect to Supabase. "
                "Please check your internet connection."
            )
        }

    except Exception as error:

        print(
            "Supabase registration connection error:",
            error
        )

        return {
            "success": False,
            "message": "Unable to connect to Supabase."
        }


# =========================================================
# REGISTER USER
# =========================================================

@router.post("/register")
async def register_user(data: RegistrationRequest):

    # ---------------------------------------------------------
    # TERMS VALIDATION
    # ---------------------------------------------------------

    if not data.accept_terms:

        return {
            "success": False,
            "message": (
                "You must accept the CivicLens terms "
                "before creating an account."
            )
        }

    # ---------------------------------------------------------
    # SUBSCRIPTION PLAN VALIDATION
    # ---------------------------------------------------------

    allowed_plans = {
        "basic",
        "professional",
        "enterprise"
    }

    if data.subscription_plan not in allowed_plans:

        return {
            "success": False,
            "message": "Please select a valid subscription plan."
        }

    # ---------------------------------------------------------
    # PHONE VALIDATION
    # ---------------------------------------------------------

    phone = re.sub(r"\s+", "", data.phone)

    if not re.match(r"^\+?[0-9]{7,15}$", phone):

        return {
            "success": False,
            "message": "Please enter a valid phone number."
        }

    # ---------------------------------------------------------
    # NORMALIZE EMAIL
    # ---------------------------------------------------------

    email = data.email.lower().strip()

    # ---------------------------------------------------------
    # CREATE USER IN SUPABASE AUTH
    # ---------------------------------------------------------

    supabase_result = create_supabase_user(data)

    if not supabase_result["success"]:

        return {
            "success": False,
            "message": supabase_result["message"]
        }

    # ---------------------------------------------------------
    # GET SUPABASE USER
    # ---------------------------------------------------------

    supabase_data = supabase_result.get("data", {})
    supabase_user = supabase_data.get("user")

    if not supabase_user:

        return {
            "success": False,
            "message": (
                "Registration could not be completed "
                "because the Supabase user was not returned."
            )
        }

    supabase_user_id = supabase_user.get("id")

    # ---------------------------------------------------------
    # REGISTRATION SUCCESS
    # ---------------------------------------------------------

    print(
        "CivicLens registration completed for:",
        email
    )

    return {
        "success": True,
        "message": (
            "Your CivicLens account has been created successfully. "
            "Please check your email if confirmation is required, "
            "then log in."
        ),
        "user_id": supabase_user_id,
        "subscription_plan": data.subscription_plan
    }

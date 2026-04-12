from google import genai
from clerk_backend_api import Clerk, AuthenticateRequestOptions
from fastapi import HTTPException
import os
from dotenv import load_dotenv

load_dotenv()

ALLOW_ORIGINS = os.getenv("ALLOW_ORIGINS", "http://localhost:5173")
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
JWT_KEY = os.getenv("JWT_KEY")

AUTHORIZED_PARTIES = [o.strip() for o in ALLOW_ORIGINS.split(",")]

clerk_sdk = Clerk(bearer_auth=CLERK_SECRET_KEY)

def authenticate_and_get_user_details(request):
    try:
        request_state = clerk_sdk.authenticate_request(
            request,
            AuthenticateRequestOptions(
                authorized_parties=AUTHORIZED_PARTIES,
                jwt_key=JWT_KEY,
            ),
        )

        if not request_state.is_signed_in:
            raise HTTPException(status_code=401, detail="Unauthorized")

        user_id = request_state.payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        return {"user_id": user_id}

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(status_code=500, detail="Authentication failed")
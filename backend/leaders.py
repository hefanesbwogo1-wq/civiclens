import json
import os
import sqlite3
import urllib.error
import urllib.request
from datetime import datetime, timezone

from fastapi import APIRouter, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from .database import get_connection


# =========================================================
# CIVICLENS LEADERS ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/leaders",
    tags=["Leaders"]
)


# =========================================================
# SUPABASE CONFIGURATION
# =========================================================

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "").strip()


# =========================================================
# DATABASE SETUP
# =========================================================

def initialize_leaders_table():

    connection = get_connection()

    try:

        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS leaders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                owner_user_id TEXT NOT NULL,

                full_name TEXT NOT NULL,
                public_name TEXT,

                position TEXT,
                organization TEXT,

                keywords TEXT,
                nicknames TEXT,

                monitoring_enabled INTEGER NOT NULL DEFAULT 1,

                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )

        connection.commit()

    finally:

        connection.close()


initialize_leaders_table()


# =========================================================
# REQUEST MODEL
# =========================================================

class LeaderRequest(BaseModel):

    full_name: str = Field(
        min_length=2,
        max_length=150
    )

    public_name: str = Field(
        default="",
        max_length=150
    )

    position: str = Field(
        default="",
        max_length=150
    )

    organization: str = Field(
        default="",
        max_length=200
    )

    keywords: str = Field(
        default="",
        max_length=2000
    )

    nicknames: str = Field(
        default="",
        max_length=2000
    )

    monitoring_enabled: bool = True


# =========================================================
# VERIFY SUPABASE SESSION
# =========================================================

def get_authenticated_user(authorization: str | None):

    if not authorization:
        return None

    if not authorization.lower().startswith("bearer "):
        return None

    access_token = authorization.split(
        " ",
        1
    )[1].strip()

    if not access_token:
        return None

    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        return None

    url = f"{SUPABASE_URL}/auth/v1/user"

    request = urllib.request.Request(
        url,
        headers={
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {access_token}"
        },
        method="GET"
    )

    try:

        with urllib.request.urlopen(
            request,
            timeout=15
        ) as response:

            body = response.read().decode(
                "utf-8",
                errors="replace"
            )

            user = json.loads(body)

            if user.get("id"):
                return user

    except Exception:
        return None

    return None


# =========================================================
# CREATE LEADER
# =========================================================

@router.post("")
async def create_leader(
    data: LeaderRequest,
    authorization: str | None = Header(default=None)
):

    user = get_authenticated_user(authorization)

    if not user:

        return JSONResponse(
            status_code=401,
            content={
                "success": False,
                "message": "Your session has expired. Please log in again."
            }
        )

    now = datetime.now(
        timezone.utc
    ).isoformat()

    connection = get_connection()

    try:

        cursor = connection.execute(
            """
            INSERT INTO leaders (
                owner_user_id,
                full_name,
                public_name,
                position,
                organization,
                keywords,
                nicknames,
                monitoring_enabled,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user["id"],
                data.full_name.strip(),
                data.public_name.strip(),
                data.position.strip(),
                data.organization.strip(),
                data.keywords.strip(),
                data.nicknames.strip(),
                1 if data.monitoring_enabled else 0,
                now,
                now
            )
        )

        connection.commit()

        leader_id = cursor.lastrowid

    finally:

        connection.close()

    return {
        "success": True,
        "message": "Leader added successfully.",
        "leader_id": leader_id
    }


# =========================================================
# GET ALL LEADERS
# =========================================================

@router.get("")
async def get_leaders(
    authorization: str | None = Header(default=None)
):

    user = get_authenticated_user(authorization)

    if not user:

        return JSONResponse(
            status_code=401,
            content={
                "success": False,
                "message": "Your session has expired. Please log in again."
            }
        )

    connection = get_connection()

    try:

        rows = connection.execute(
            """
            SELECT
                id,
                full_name,
                public_name,
                position,
                organization,
                keywords,
                nicknames,
                monitoring_enabled,
                created_at,
                updated_at
            FROM leaders
            WHERE owner_user_id = ?
            ORDER BY id DESC
            """,
            (user["id"],)
        ).fetchall()

        leaders = []

        for row in rows:

            leaders.append(
                {
                    "id": row["id"],
                    "full_name": row["full_name"],
                    "public_name": row["public_name"] or "",
                    "position": row["position"] or "",
                    "organization": row["organization"] or "",
                    "keywords": row["keywords"] or "",
                    "nicknames": row["nicknames"] or "",
                    "monitoring_enabled": bool(
                        row["monitoring_enabled"]
                    ),
                    "created_at": row["created_at"],
                    "updated_at": row["updated_at"]
                }
            )

    finally:

        connection.close()

    return {
        "success": True,
        "leaders": leaders,
        "count": len(leaders)
    }


# =========================================================
# UPDATE LEADER
# =========================================================

@router.put("/{leader_id}")
async def update_leader(
    leader_id: int,
    data: LeaderRequest,
    authorization: str | None = Header(default=None)
):

    user = get_authenticated_user(authorization)

    if not user:

        return JSONResponse(
            status_code=401,
            content={
                "success": False,
                "message": "Your session has expired. Please log in again."
            }
        )

    now = datetime.now(
        timezone.utc
    ).isoformat()

    connection = get_connection()

    try:

        existing = connection.execute(
            """
            SELECT id
            FROM leaders
            WHERE id = ?
            AND owner_user_id = ?
            """,
            (
                leader_id,
                user["id"]
            )
        ).fetchone()

        if not existing:

            return JSONResponse(
                status_code=404,
                content={
                    "success": False,
                    "message": "Leader not found."
                }
            )

        connection.execute(
            """
            UPDATE leaders
            SET
                full_name = ?,
                public_name = ?,
                position = ?,
                organization = ?,
                keywords = ?,
                nicknames = ?,
                monitoring_enabled = ?,
                updated_at = ?
            WHERE id = ?
            AND owner_user_id = ?
            """,
            (
                data.full_name.strip(),
                data.public_name.strip(),
                data.position.strip(),
                data.organization.strip(),
                data.keywords.strip(),
                data.nicknames.strip(),
                1 if data.monitoring_enabled else 0,
                now,
                leader_id,
                user["id"]
            )
        )

        connection.commit()

    finally:

        connection.close()

    return {
        "success": True,
        "message": "Leader updated successfully."
    }


# =========================================================
# DELETE LEADER
# =========================================================

@router.delete("/{leader_id}")
async def delete_leader(
    leader_id: int,
    authorization: str | None = Header(default=None)
):

    user = get_authenticated_user(authorization)

    if not user:

        return JSONResponse(
            status_code=401,
            content={
                "success": False,
                "message": "Your session has expired. Please log in again."
            }
        )

    connection = get_connection()

    try:

        existing = connection.execute(
            """
            SELECT id
            FROM leaders
            WHERE id = ?
            AND owner_user_id = ?
            """,
            (
                leader_id,
                user["id"]
            )
        ).fetchone()

        if not existing:

            return JSONResponse(
                status_code=404,
                content={
                    "success": False,
                    "message": "Leader not found."
                }
            )

        connection.execute(
            """
            DELETE FROM leaders
            WHERE id = ?
            AND owner_user_id = ?
            """,
            (
                leader_id,
                user["id"]
            )
        )

        connection.commit()

    finally:

        connection.close()

    return {
        "success": True,
        "message": "Leader deleted successfully."
    }


# =========================================================
# TOGGLE MONITORING
# =========================================================

@router.patch("/{leader_id}/monitoring")
async def toggle_monitoring(
    leader_id: int,
    authorization: str | None = Header(default=None)
):

    user = get_authenticated_user(authorization)

    if not user:

        return JSONResponse(
            status_code=401,
            content={
                "success": False,
                "message": "Your session has expired. Please log in again."
            }
        )

    connection = get_connection()

    try:

        row = connection.execute(
            """
            SELECT monitoring_enabled
            FROM leaders
            WHERE id = ?
            AND owner_user_id = ?
            """,
            (
                leader_id,
                user["id"]
            )
        ).fetchone()

        if not row:

            return JSONResponse(
                status_code=404,
                content={
                    "success": False,
                    "message": "Leader not found."
                }
            )

        new_status = 0 if row["monitoring_enabled"] else 1

        connection.execute(
            """
            UPDATE leaders
            SET
                monitoring_enabled = ?,
                updated_at = ?
            WHERE id = ?
            AND owner_user_id = ?
            """,
            (
                new_status,
                datetime.now(
                    timezone.utc
                ).isoformat(),
                leader_id,
                user["id"]
            )
        )

        connection.commit()

    finally:

        connection.close()

    return {
        "success": True,
        "monitoring_enabled": bool(new_status)
    }
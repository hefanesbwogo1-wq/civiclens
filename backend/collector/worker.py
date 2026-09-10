"""
CivicLens Mention Collection Worker

Responsible for:
- Loading monitored leaders
- Building search queries
- Calling platform providers
- Sending returned posts into the collection pipeline
"""

from typing import Any

from .normalizer import normalize_terms
from .service import process_post
from .providers.registry import get_provider


# =========================================================
# BUILD LEADER QUERIES
# =========================================================

def build_leader_queries(
    leader: dict[str, Any]
) -> list[str]:
    """
    Build unique search queries for one leader.
    """

    queries: list[str] = []

    # Main identity
    for field in (
        "full_name",
        "public_name"
    ):

        value = leader.get(field)

        if value:

            value = str(value).strip()

            if value and value not in queries:
                queries.append(value)

    # Keywords and nicknames
    for field in (
        "keywords",
        "nicknames"
    ):

        value = leader.get(field)

        if value:

            for term in normalize_terms(
                str(value)
            ):

                if (
                    term
                    and term not in queries
                ):
                    queries.append(term)

    return queries


# =========================================================
# LOAD MONITORED LEADERS
# =========================================================

def get_monitored_leaders(
    supabase,
    user_id: str
) -> list[dict[str, Any]]:

    response = (
        supabase
        .table("leaders")
        .select(
            """
            id,
            full_name,
            public_name,
            keywords,
            nicknames,
            monitoring_enabled
            """
        )
        .eq(
            "user_id",
            user_id
        )
        .eq(
            "monitoring_enabled",
            True
        )
        .execute()
    )

    return response.data or []


# =========================================================
# COLLECT FROM ONE PLATFORM
# =========================================================

async def collect_platform(
    supabase,
    user_id: str,
    platform: str,
    leaders: list[dict[str, Any]],
    max_results: int = 100
) -> dict[str, Any]:
    """
    Collect posts from one platform.
    """

    provider = get_provider(platform)

    collected = 0
    matched = 0
    duplicates = 0
    errors = 0

    processed_ids: set[str] = set()

    for leader in leaders:

        queries = build_leader_queries(
            leader
        )

        for query in queries:

            try:

                posts = await provider.search(
                    query=query,
                    max_results=max_results
                )

            except NotImplementedError:

                # Provider has not yet been connected
                # to its real API.
                continue

            except Exception as error:

                errors += 1

                print(
                    f"CivicLens {platform} collection "
                    f"error for '{query}':",
                    error
                )

                continue

            for post in posts:

                post_id = (
                    post.external_id
                    or ""
                )

                # Prevent the same returned post
                # from being processed repeatedly
                # during this worker run.
                if post_id:

                    unique_key = (
                        f"{platform}:{post_id}"
                    )

                    if unique_key in processed_ids:
                        continue

                    processed_ids.add(
                        unique_key
                    )

                collected += 1

                result = process_post(
                    supabase,
                    user_id,
                    post.to_dict()
                )

                status = result.get(
                    "status"
                )

                if status == "collected":

                    matched += len(
                        result.get(
                            "matches",
                            []
                        )
                    )

                elif status == "duplicate":

                    duplicates += 1

    return {
        "platform": platform,
        "collected": collected,
        "matched": matched,
        "duplicates": duplicates,
        "errors": errors
    }


# =========================================================
# RUN COLLECTION
# =========================================================

async def run_collection(
    supabase,
    user_id: str,
    platforms: list[str]
) -> dict[str, Any]:
    """
    Run collection across the requested platforms.
    """

    leaders = get_monitored_leaders(
        supabase,
        user_id
    )

    if not leaders:

        return {
            "success": True,
            "leaders": 0,
            "platforms": [],
            "message": "No monitored leaders found."
        }

    results = []

    for platform in platforms:

        result = await collect_platform(
            supabase=supabase,
            user_id=user_id,
            platform=platform,
            leaders=leaders
        )

        results.append(result)

    return {
        "success": True,
        "leaders": len(leaders),
        "platforms": results
    }
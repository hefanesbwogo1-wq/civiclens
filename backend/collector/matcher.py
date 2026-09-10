"""
CivicLens Leader Matching Engine

Matches social-media posts against the names,
public names, keywords and nicknames configured
for CivicLens leaders.
"""

import re
from typing import Any

from .normalizer import normalize_text, normalize_terms


# =========================================================
# CONFIGURATION
# =========================================================

MIN_TERM_LENGTH = 3


# =========================================================
# TERM MATCHING
# =========================================================

def term_matches(text: str, term: str) -> bool:
    """
    Determine whether a normalized term appears in text.

    Multi-word phrases are matched directly.

    Single-word terms use word boundaries to reduce
    accidental partial matches.
    """

    if not text or not term:
        return False

    if len(term) < MIN_TERM_LENGTH:
        return False

    # Multi-word phrase
    if " " in term:
        return term in text

    # Single word
    pattern = rf"(?<!\w){re.escape(term)}(?!\w)"

    return bool(re.search(pattern, text))


# =========================================================
# LEADER TERMS
# =========================================================

def get_leader_terms(leader: dict[str, Any]) -> list[str]:
    """
    Extract all searchable identifiers for a leader.

    Supported fields:

        full_name
        public_name
        keywords
        nicknames
    """

    terms: list[str] = []

    # Main identity fields
    for field in ("full_name", "public_name"):
        value = leader.get(field)

        if value:
            normalized = normalize_text(str(value))

            if normalized:
                terms.append(normalized)

    # Multiple-value fields
    for field in ("keywords", "nicknames"):
        value = leader.get(field)

        if value:
            terms.extend(
                normalize_terms(str(value))
            )

    # Remove duplicates while preserving order
    unique_terms = []

    for term in terms:
        if term not in unique_terms:
            unique_terms.append(term)

    return unique_terms


# =========================================================
# MATCH ONE LEADER
# =========================================================

def match_leader(
    post_text: str,
    leader: dict[str, Any]
) -> dict[str, Any]:
    """
    Match one post against one leader.

    Returns:

        {
            "matched": True/False,
            "leader_id": "...",
            "leader_name": "...",
            "matched_terms": [...]
        }
    """

    normalized_post = normalize_text(post_text)

    leader_terms = get_leader_terms(leader)

    matched_terms = []

    for term in leader_terms:

        if term_matches(
            normalized_post,
            term
        ):
            matched_terms.append(term)

    leader_name = (
        leader.get("public_name")
        or leader.get("full_name")
        or "Unknown Leader"
    )

    return {
        "matched": bool(matched_terms),
        "leader_id": leader.get("id"),
        "leader_name": leader_name,
        "matched_terms": matched_terms
    }


# =========================================================
# MATCH AGAINST MULTIPLE LEADERS
# =========================================================

def match_leaders(
    post_text: str,
    leaders: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    """
    Match a post against all tracked leaders.

    A single post may mention more than one leader.
    """

    matches = []

    for leader in leaders:

        result = match_leader(
            post_text,
            leader
        )

        if result["matched"]:
            matches.append(result)

    return matches
"""
CivicLens Text Normalizer

Responsible for preparing social-media text and leader
identifiers for reliable matching.
"""

import re
import unicodedata


def normalize_text(value: str) -> str:
    """
    Normalize text for matching.

    Examples:
        "Hon. JOHN Kiptoo!" -> "hon john kiptoo"
        "John   Kiptoo"     -> "john kiptoo"
    """

    if not value:
        return ""

    value = str(value)

    # Unicode normalization
    value = unicodedata.normalize("NFKC", value)

    # Lowercase
    value = value.casefold()

    # Replace punctuation with spaces
    value = re.sub(r"[^\w\s]", " ", value, flags=re.UNICODE)

    # Collapse repeated whitespace
    value = re.sub(r"\s+", " ", value)

    return value.strip()


def split_terms(value: str) -> list[str]:
    """
    Convert comma/newline/semicolon separated values
    into clean individual terms.

    Example:
        "John Kiptoo, JK, Kiptoo"
        ->
        ["John Kiptoo", "JK", "Kiptoo"]
    """

    if not value:
        return []

    parts = re.split(r"[,;\n|]+", str(value))

    results = []

    for part in parts:
        term = part.strip()

        if term:
            results.append(term)

    return results


def normalize_terms(value: str) -> list[str]:
    """
    Split and normalize a collection of terms.
    """

    terms = split_terms(value)

    normalized = []

    for term in terms:
        cleaned = normalize_text(term)

        if cleaned:
            normalized.append(cleaned)

    return normalized
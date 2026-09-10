"""
CivicLens Platform Provider Registry
"""

from .base import PlatformProvider
from .x import XProvider
from .facebook import FacebookProvider


# =========================================================
# PROVIDER REGISTRY
# =========================================================

PROVIDERS: dict[str, type[PlatformProvider]] = {
    "x": XProvider,
    "facebook": FacebookProvider,
}


# =========================================================
# GET PROVIDER
# =========================================================

def get_provider(platform: str) -> PlatformProvider:

    platform_key = platform.strip().lower()

    provider_class = PROVIDERS.get(
        platform_key
    )

    if not provider_class:

        raise ValueError(
            f"Unsupported platform: {platform}"
        )

    return provider_class()


# =========================================================
# AVAILABLE PROVIDERS
# =========================================================

def available_providers() -> list[str]:

    return sorted(
        PROVIDERS.keys()
    )
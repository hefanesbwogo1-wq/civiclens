"""
CivicLens Facebook Platform Provider

This module will connect CivicLens to approved Facebook /
Meta APIs where the required permissions and access are
available.
"""

import os
from datetime import datetime
from typing import Optional

from .base import PlatformProvider, SocialPost


class FacebookProvider(PlatformProvider):

    platform_name = "facebook"

    def __init__(self):

        self.access_token = os.getenv(
            "FACEBOOK_ACCESS_TOKEN",
            ""
        ).strip()

    async def search(
        self,
        query: str,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        max_results: int = 100
    ) -> list[SocialPost]:

        if not self.access_token:

            raise RuntimeError(
                "FACEBOOK_ACCESS_TOKEN is not configured."
            )

        # -------------------------------------------------
        # STEP 4 ONLY
        # -------------------------------------------------
        # Actual Meta API integration will be implemented
        # after provider architecture testing.
        # -------------------------------------------------

        raise NotImplementedError(
            "Facebook API integration will be implemented "
            "in the platform integration step."
        )

    async def health_check(self) -> bool:

        return bool(self.access_token)
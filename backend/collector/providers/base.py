"""
CivicLens Platform Provider Base

Every supported social-media provider must convert its
platform-specific response into this common format.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Optional


# =========================================================
# CANONICAL SOCIAL MEDIA POST
# =========================================================

@dataclass
class SocialPost:
    """
    Standard CivicLens representation of a social-media post.
    """

    platform: str

    external_id: str

    content: str

    author_name: Optional[str] = None

    author_handle: Optional[str] = None

    post_url: Optional[str] = None

    published_at: Optional[datetime] = None

    metadata: Optional[dict] = None

    def to_dict(self) -> dict:
        """
        Convert the post into a dictionary that can be passed
        to the CivicLens collection service.
        """

        return {
            "platform": self.platform,
            "external_id": self.external_id,
            "author_name": self.author_name,
            "author_handle": self.author_handle,
            "content": self.content,
            "post_url": self.post_url,
            "published_at": self.published_at,
            "metadata": self.metadata or {}
        }


# =========================================================
# PLATFORM PROVIDER
# =========================================================

class PlatformProvider(ABC):
    """
    Base class for all CivicLens platform providers.
    """

    platform_name: str = "unknown"

    @abstractmethod
    async def search(
        self,
        query: str,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        max_results: int = 100
    ) -> list[SocialPost]:
        """
        Search the platform and return normalized posts.
        """

        raise NotImplementedError

    async def health_check(self) -> bool:
        """
        Basic provider health check.

        Individual providers can override this when they need
        a real API connectivity test.
        """

        return True
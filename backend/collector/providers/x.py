"""CivicLens X (Twitter) recent-search provider."""

import os
from datetime import datetime, timezone
from typing import Optional

import httpx

from .base import PlatformProvider, SocialPost


class XProvider(PlatformProvider):
    """Fetch public posts from X and normalize them for CivicLens."""

    platform_name = "x"
    SEARCH_URL = "https://api.x.com/2/tweets/search/recent"

    def __init__(self):
        self.bearer_token = os.getenv("X_BEARER_TOKEN", "").strip()

    async def health_check(self) -> bool:
        """Report whether the provider has the credentials it needs."""
        return bool(self.bearer_token)

    async def search(
        self,
        query: str,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        max_results: int = 100,
    ) -> list[SocialPost]:
        """Search recent X posts and return CivicLens ``SocialPost`` records."""
        if not self.bearer_token:
            raise RuntimeError("X_BEARER_TOKEN is not configured.")

        if not query or not query.strip():
            return []

        params = {
            "query": query.strip(),
            "max_results": max(10, min(int(max_results), 100)),
            "tweet.fields": "id,text,author_id,created_at,lang,public_metrics",
            "expansions": "author_id",
            "user.fields": "id,name,username",
        }

        if start_time:
            params["start_time"] = self._format_timestamp(start_time)
        if end_time:
            params["end_time"] = self._format_timestamp(end_time)

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    self.SEARCH_URL,
                    headers={
                        "Authorization": f"Bearer {self.bearer_token}",
                        "Accept": "application/json",
                    },
                    params=params,
                )
        except httpx.HTTPError as error:
            raise RuntimeError("Unable to reach the X API.") from error

        self._raise_for_error(response)

        try:
            payload = response.json()
        except ValueError as error:
            raise RuntimeError("X API returned an invalid response.") from error

        users = {
            user["id"]: user
            for user in payload.get("includes", {}).get("users", [])
            if user.get("id")
        }
        posts = []

        for tweet in payload.get("data", []):
            tweet_id = tweet.get("id")
            if not tweet_id:
                continue

            author = users.get(tweet.get("author_id"), {})
            username = author.get("username")

            posts.append(
                SocialPost(
                    platform=self.platform_name,
                    external_id=tweet_id,
                    content=tweet.get("text", ""),
                    author_name=author.get("name"),
                    author_handle=f"@{username}" if username else None,
                    post_url=(
                        f"https://x.com/{username}/status/{tweet_id}"
                        if username
                        else None
                    ),
                    published_at=self._parse_timestamp(tweet.get("created_at")),
                    metadata={
                        "author_id": tweet.get("author_id"),
                        "lang": tweet.get("lang"),
                        "public_metrics": tweet.get("public_metrics", {}),
                    },
                )
            )

        return posts

    @staticmethod
    def _format_timestamp(value: datetime) -> str:
        """Format an X API timestamp in UTC."""
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")

    @staticmethod
    def _parse_timestamp(value: Optional[str]) -> Optional[datetime]:
        if not value:
            return None
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None

    @staticmethod
    def _raise_for_error(response: httpx.Response) -> None:
        if response.status_code == 401:
            raise RuntimeError("X API authentication failed. Check X_BEARER_TOKEN.")
        if response.status_code == 403:
            raise RuntimeError("X API access was forbidden. Check access permissions.")
        if response.status_code == 429:
            raise RuntimeError("X API rate limit reached. Try again later.")
        if response.is_error:
            raise RuntimeError(f"X API request failed ({response.status_code}).")

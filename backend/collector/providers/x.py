import os
from datetime import datetime
from typing import Any

import requests


class XProvider:

    platform = "x"

    SEARCH_URL = "https://api.x.com/2/tweets/search/recent"

    def __init__(self):
        self.bearer_token = os.getenv(
            "X_BEARER_TOKEN",
            ""
        ).strip()

    def health_check(self) -> dict[str, Any]:

        if not self.bearer_token:

            return {
                "platform": self.platform,
                "healthy": False,
                "message": "X_BEARER_TOKEN is not configured."
            }

        return {
            "platform": self.platform,
            "healthy": True,
            "message": "X API credentials are configured."
        }

    def search(
        self,
        query: str,
        max_results: int = 10
    ) -> list[dict[str, Any]]:

        if not self.bearer_token:

            raise RuntimeError(
                "X_BEARER_TOKEN is not configured."
            )

        if not query or not query.strip():
            return []

        max_results = max(
            10,
            min(int(max_results), 100)
        )

        headers = {
            "Authorization": (
                f"Bearer {self.bearer_token}"
            ),
            "Accept": "application/json"
        }

        params = {
            "query": query.strip(),
            "max_results": max_results,
            "tweet.fields": (
                "id,"
                "text,"
                "author_id,"
                "created_at,"
                "lang,"
                "public_metrics"
            ),
            "expansions": "author_id",
            "user.fields": (
                "id,"
                "name,"
                "username"
            )
        }

        response = requests.get(
            self.SEARCH_URL,
            headers=headers,
            params=params,
            timeout=30
        )

        if response.status_code == 401:

            raise RuntimeError(
                "X API authentication failed. "
                "Check X_BEARER_TOKEN."
            )

        if response.status_code == 403:

            raise RuntimeError(
                "X API access was forbidden. "
                "Check your X API access level and permissions."
            )

        if response.status_code == 429:

            raise RuntimeError(
                "X API rate limit reached. "
                "Try again later."
            )

        if not response.ok:

            try:
                error_data = response.json()
            except Exception:
                error_data = response.text

            raise RuntimeError(
                f"X API request failed "
                f"({response.status_code}): "
                f"{error_data}"
            )

        payload = response.json()

        users = {}

        for user in (
            payload
            .get("includes", {})
            .get("users", [])
        ):

            user_id = user.get("id")

            if user_id:
                users[user_id] = user

        posts = []

        for tweet in payload.get(
            "data",
            []
        ):

            tweet_id = tweet.get("id")

            if not tweet_id:
                continue

            author_id = tweet.get(
                "author_id"
            )

            author = users.get(
                author_id,
                {}
            )

            username = author.get(
                "username"
            )

            author_name = author.get(
                "name"
            )

            post_url = None

            if username:

                post_url = (
                    "https://x.com/"
                    f"{username}/status/"
                    f"{tweet_id}"
                )

            published_at = None

            created_at = tweet.get(
                "created_at"
            )

            if created_at:

                try:

                    published_at = datetime.fromisoformat(
                        created_at.replace(
                            "Z",
                            "+00:00"
                        )
                    )

                except ValueError:

                    published_at = None

            posts.append({

                "platform": "x",

                "external_id": tweet_id,

                "author_name": author_name,

                "author_handle": (
                    f"@{username}"
                    if username
                    else None
                ),

                "content": tweet.get(
                    "text",
                    ""
                ),

                "post_url": post_url,

                "published_at": published_at,

                "sentiment": "neutral",

                "metadata": {
                    "author_id": author_id,
                    "lang": tweet.get("lang"),
                    "public_metrics": tweet.get(
                        "public_metrics",
                        {}
                    )
                }

            })

        return posts
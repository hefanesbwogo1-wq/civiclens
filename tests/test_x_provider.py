import asyncio
import os
import unittest
from unittest.mock import patch

from backend.collector.providers.base import SocialPost
from backend.collector.providers.x import XProvider


class FakeResponse:
    status_code = 200
    is_error = False

    def json(self):
        return {
            "data": [
                {
                    "id": "tweet-1",
                    "text": "A tracked public mention",
                    "author_id": "author-1",
                    "created_at": "2026-09-12T10:00:00Z",
                    "lang": "en",
                    "public_metrics": {"like_count": 3},
                }
            ],
            "includes": {
                "users": [
                    {
                        "id": "author-1",
                        "name": "Test User",
                        "username": "testuser",
                    }
                ]
            },
        }


class FakeClient:
    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return None

    async def get(self, *args, **kwargs):
        return FakeResponse()


class XProviderTests(unittest.TestCase):
    def test_search_returns_normalized_social_posts(self):
        with patch.dict(os.environ, {"X_BEARER_TOKEN": "test-token"}):
            provider = XProvider()

        with patch(
            "backend.collector.providers.x.httpx.AsyncClient",
            return_value=FakeClient(),
        ):
            posts = asyncio.run(provider.search("CivicLens"))

        self.assertEqual(len(posts), 1)
        self.assertIsInstance(posts[0], SocialPost)
        self.assertEqual(posts[0].platform, "x")
        self.assertEqual(posts[0].external_id, "tweet-1")
        self.assertEqual(posts[0].author_handle, "@testuser")
        self.assertEqual(posts[0].post_url, "https://x.com/testuser/status/tweet-1")

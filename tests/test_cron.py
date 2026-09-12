import os
import unittest
from unittest.mock import patch

from backend.collector.cron import has_valid_cron_secret


class CronSecurityTests(unittest.TestCase):
    def test_requires_a_configured_matching_bearer_token(self):
        with patch.dict(os.environ, {"CRON_SECRET": "expected-secret"}, clear=False):
            self.assertTrue(has_valid_cron_secret("Bearer expected-secret"))
            self.assertFalse(has_valid_cron_secret("Bearer wrong-secret"))
            self.assertFalse(has_valid_cron_secret(None))

    def test_rejects_requests_when_no_secret_is_configured(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertFalse(has_valid_cron_secret("Bearer any-value"))

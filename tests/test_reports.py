import unittest

from backend.reports import count_nonempty


class ReportAggregationTests(unittest.TestCase):
    def test_count_nonempty_ignores_missing_values(self):
        rows = [
            {"platform": "x"},
            {"platform": "x"},
            {"platform": "facebook"},
            {"platform": ""},
            {},
        ]

        self.assertEqual(count_nonempty(rows, "platform"), {"x": 2, "facebook": 1})

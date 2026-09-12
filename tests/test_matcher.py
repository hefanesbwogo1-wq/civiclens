import unittest

from backend.collector.matcher import match_leaders


class LeaderMatcherTests(unittest.TestCase):
    def test_matches_names_and_terms_without_partial_word_matches(self):
        leaders = [
            {
                "id": "leader-1",
                "full_name": "Amina Wanjiku",
                "public_name": "Amina",
                "keywords": "education, schools",
                "nicknames": "AW",
            }
        ]

        matches = match_leaders("Amina Wanjiku discussed education reforms.", leaders)
        self.assertEqual(len(matches), 1)
        self.assertIn("amina wanjiku", matches[0]["matched_terms"])
        self.assertIn("education", matches[0]["matched_terms"])

        self.assertEqual(match_leaders("The animation is popular.", leaders), [])

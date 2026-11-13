import json
import tempfile
import unittest
from pathlib import Path

import check_updates as cu


class CheckUpdatesTest(unittest.TestCase):
    def test_builds_a_download_url_from_a_drive_file_link(self):
        url = cu.drive_download_url("https://drive.google.com/file/d/abc_123-X/view")
        self.assertEqual(url, "https://drive.google.com/uc?export=download&id=abc_123-X")

    def test_rejects_a_link_that_is_not_a_drive_file(self):
        self.assertIsNone(cu.drive_download_url("https://example.com/in.pdf"))

    def test_flags_a_different_hash_as_changed(self):
        self.assertEqual(cu.verdict("aa", "bb"), "changed")
        self.assertEqual(cu.verdict("aa", "aa"), "current")

    def test_lists_each_distinct_source_once(self):
        with tempfile.TemporaryDirectory() as tmp:
            for name in ("manifest.json", "occupations.manifest.json"):
                (Path(tmp) / name).write_text(
                    json.dumps({"doc": "IN-1", "source_url": "u", "pdf_sha256": "h"})
                )
            (Path(tmp) / "other.manifest.json").write_text(json.dumps({"doc": "X"}))
            self.assertEqual(len(cu.find_sources(Path(tmp))), 1)


if __name__ == "__main__":
    unittest.main()

import sys
import unittest
from pathlib import Path

import check_updates as cu
import refresh_norms as rn


def source(doc: str) -> cu.Source:
    return cu.Source("manifest.json", doc, "https://drive.google.com/file/d/abc/view", "aa")


class RefreshNormsTest(unittest.TestCase):
    def tools(self, doc: str) -> list[str]:
        commands = rn.plan(source(doc), Path("x.pdf"), Path("out"), "2026-11-16")
        return [Path(c[1]).name for c in commands]

    def test_runs_the_annex_tools_of_in_5_after_the_one_that_rewrites_the_manifest(self):
        self.assertEqual(
            self.tools("IN-5"),
            ["extract_in5.py", "extract_in5_annex_c.py", "extract_in5_annex_d.py"],
        )

    def test_has_the_extractors_of_every_document_with_a_manifest(self):
        for found in cu.find_sources(cu.DEFAULT_NORMS):
            self.assertIn(found.doc, rn.EXTRACTORS)

    def test_passes_the_link_and_the_date_only_to_the_tools_that_write_them(self):
        by_tool = {
            Path(c[1]).name: c
            for c in rn.plan(source("IN-5"), Path("x.pdf"), Path("out"), "2026-11-16")
        }
        self.assertIn("--url", by_tool["extract_in5.py"])
        self.assertIn("2026-11-16", by_tool["extract_in5.py"])
        self.assertNotIn("--url", by_tool["extract_in5_annex_c.py"])
        self.assertEqual(by_tool["extract_in5.py"][0], sys.executable)

    def test_writes_each_tool_into_its_own_folder(self):
        commands = rn.plan(source("IN-1-P2"), Path("x.pdf"), Path("out"), "2026-11-16")
        self.assertTrue(all(c[c.index("--out") + 1] == str(Path("out") / "in-1-p2") for c in commands))

    def test_rejects_a_document_it_does_not_know(self):
        with self.assertRaises(KeyError):
            rn.plan(source("IN-99"), Path("x.pdf"), Path("out"), "2026-11-16")


if __name__ == "__main__":
    unittest.main()

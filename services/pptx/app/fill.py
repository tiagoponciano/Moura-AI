"""Fills the {{tags}} of a .pptx template. Pure functions: no HTTP, no files."""

import copy
import re
from typing import Union

from pptx.presentation import Presentation

TAG = re.compile(r"\{\{\s*(\w+)\s*\}\}")

Value = Union[str, list[str]]


def _paragraphs(prs: Presentation):
    for slide in prs.slides:
        for shape in slide.shapes:
            if shape.has_text_frame:
                yield from shape.text_frame.paragraphs


def template_tags(prs: Presentation) -> set[str]:
    """Every tag the template holds, for checking a template and its values agree."""
    tags: set[str] = set()
    for paragraph in _paragraphs(prs):
        tags.update(TAG.findall("".join(run.text for run in paragraph.runs)))
    return tags


def _set_text(paragraph, text: str) -> None:
    """Puts the text in the first run, keeping its formatting, and empties the rest."""
    runs = paragraph.runs
    runs[0].text = text
    for run in runs[1:]:
        run.text = ""


def fill(prs: Presentation, values: dict[str, Value]) -> list[str]:
    """Replaces the tags in place and returns the tags that had no value.

    A paragraph made only of one tag whose value is a list becomes one
    paragraph per entry, each with the original paragraph's formatting; an
    empty list removes the paragraph. A tag without a value becomes empty text.
    """
    missing: list[str] = []
    for paragraph in list(_paragraphs(prs)):
        if not paragraph.runs:
            continue
        text = "".join(run.text for run in paragraph.runs)
        tags = TAG.findall(text)
        if not tags:
            continue

        whole = TAG.fullmatch(text.strip())
        if whole and isinstance(values.get(whole.group(1)), list):
            entries = values[whole.group(1)]
            element = paragraph._p
            if not entries:
                element.getparent().remove(element)
                continue
            _set_text(paragraph, entries[0])
            for entry in reversed(entries[1:]):
                clone = copy.deepcopy(element)
                element.addnext(clone)
                runs = clone.findall(
                    "{http://schemas.openxmlformats.org/drawingml/2006/main}r"
                )
                runs[0].find(
                    "{http://schemas.openxmlformats.org/drawingml/2006/main}t"
                ).text = entry
                for extra in runs[1:]:
                    clone.remove(extra)
            continue

        def replace(match: re.Match) -> str:
            value = values.get(match.group(1))
            if value is None:
                missing.append(match.group(1))
                return ""
            return value if isinstance(value, str) else " ".join(value)

        _set_text(paragraph, TAG.sub(replace, text))
    return missing

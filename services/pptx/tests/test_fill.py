import io

from pptx import Presentation

from app.build_template import build
from app.fill import fill, template_tags
from app.proposal import ProposalValues, tag_values


def texts(prs):
    return [
        "".join(run.text for run in paragraph.runs)
        for slide in prs.slides
        for shape in slide.shapes
        if shape.has_text_frame
        for paragraph in shape.text_frame.paragraphs
    ]


def test_template_tags_are_exactly_the_proposal_values():
    expected = set(ProposalValues.model_fields)
    assert template_tags(build()) == expected


def test_fill_replaces_a_tag_inside_a_sentence():
    prs = build()
    fill(prs, tag_values(ProposalValues(client="Padaria Silva")))
    assert "Cliente: Padaria Silva" in texts(prs)


def test_fill_leaves_no_tag_behind():
    prs = build()
    fill(prs, tag_values(ProposalValues(client="X")))
    assert not any("{{" in text for text in texts(prs))


def test_a_list_becomes_one_paragraph_per_entry():
    prs = build()
    fill(prs, tag_values(ProposalValues(plan_items=["um", "dois", "três"])))
    assert [t for t in texts(prs) if t.startswith("☑")] == ["☑ um", "☑ dois", "☑ três"]


def test_an_empty_list_removes_its_paragraph():
    prs = build()
    fill(prs, tag_values(ProposalValues(notes=[])))
    assert "{{notes}}" not in texts(prs)


def test_the_default_exclusions_are_listed_with_bullets():
    prs = build()
    fill(prs, tag_values(ProposalValues()))
    bullets = [t for t in texts(prs) if t.startswith("• ")]
    assert len(bullets) == 4


def test_a_tag_without_a_value_becomes_empty_and_is_reported():
    prs = build()
    missing = fill(prs, {"client": "X"})
    assert "price" in missing
    assert not any("{{" in text for text in texts(prs))


def test_filled_deck_survives_a_save_and_reload():
    prs = build()
    fill(prs, tag_values(ProposalValues(price="R$ 1.500,00")))
    out = io.BytesIO()
    prs.save(out)
    out.seek(0)
    assert "R$ 1.500,00" in texts(Presentation(out))

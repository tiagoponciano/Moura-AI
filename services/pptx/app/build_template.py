"""Builds templates/proposal.pptx, the base of Moura's proposal.

Run `python -m app.build_template` from services/pptx to rebuild it. When the
office has the original deck, it can replace the file as long as it keeps the
tags listed in app/proposal.py.
"""

from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt

GRAY = RGBColor(0x4B, 0x4F, 0x58)
ORANGE = RGBColor(0xE8, 0x69, 0x2F)
INK = RGBColor(0x1F, 0x22, 0x28)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
FONT = "Arial"

OUT = Path(__file__).resolve().parent.parent / "templates" / "proposal.pptx"


def textbox(slide, left, top, width, height, paragraphs, align=None):
    """paragraphs: list of (text, size, bold, color, italic)."""
    frame = slide.shapes.add_textbox(
        Inches(left), Inches(top), Inches(width), Inches(height)
    ).text_frame
    frame.word_wrap = True
    for index, (text, size, bold, color, italic) in enumerate(paragraphs):
        paragraph = frame.paragraphs[0] if index == 0 else frame.add_paragraph()
        if align:
            paragraph.alignment = align
        run = paragraph.add_run()
        run.text = text
        run.font.name = FONT
        run.font.size = Pt(size)
        run.font.bold = bold
        run.font.italic = italic
        run.font.color.rgb = color
    return frame


def rectangle(slide, left, top, width, height, color):
    shape = slide.shapes.add_shape(1, Inches(left), Inches(top), Inches(width), Inches(height))
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()
    return shape


def blank(prs):
    return prs.slides.add_slide(prs.slide_layouts[6])


def brand(slide):
    textbox(slide, 11.6, 0.3, 1.5, 0.5, [("MOURA", 12, True, ORANGE, False)], PP_ALIGN.RIGHT)


def build() -> Presentation:
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    # 1. Cover
    slide = blank(prs)
    textbox(slide, 0.7, 0.6, 5, 0.6, [("MOURA SOLUÇÕES EM ENGENHARIA", 14, True, GRAY, False)])
    textbox(slide, 0.7, 2.0, 7.5, 2.4, [
        ("PROPOSTA", 44, True, GRAY, False),
        ("TÉCNICA E", 44, True, ORANGE, False),
        ("COMERCIAL", 44, True, ORANGE, False),
    ])
    textbox(slide, 0.7, 4.9, 7.5, 1.9, [
        ("Cliente: {{client}}", 18, False, INK, False),
        ("Empreendimento: {{project_name}}", 18, False, INK, False),
        ("Município/UF: {{city_state}}", 18, False, INK, False),
        ("Data da proposta: {{date}}", 18, False, INK, False),
    ])
    rectangle(slide, 12.2, 5.9, 1.133, 1.6, GRAY)

    # 2. Who we are
    slide = blank(prs)
    brand(slide)
    rectangle(slide, 0, 6.1, 1.3, 0.9, GRAY)
    textbox(slide, 6.2, 0.4, 6.5, 1.4, [("QUEM", 36, True, ORANGE, False), ("SOMOS?", 36, True, GRAY, False)])
    textbox(slide, 6.2, 1.9, 6.7, 4.2, [
        ("A Moura Soluções em Engenharia atua na regularização e condução técnica de processos de prevenção e proteção contra incêndio, com foco em segurança, agilidade e redução de retrabalho.", 14, False, INK, False),
        ("Conduzimos cada etapa com clareza técnica, alinhamento documental e suporte ao cliente, buscando reduzir pendências, evitar atrasos e dar previsibilidade ao processo junto ao CBMSC.", 14, False, INK, False),
        ("Mais do que elaborar projetos, entregamos condução técnica para que o cliente avance na regularização com segurança, tranquilidade e menor desgaste operacional.", 14, False, INK, False),
    ], PP_ALIGN.JUSTIFY)
    textbox(slide, 1.5, 6.5, 11, 0.5, [("Cuidamos da parte técnica para que o cliente não precise aprender na dor o caminho da regularização", 13, False, INK, True)])

    # 3. Commercial proposal
    slide = blank(prs)
    brand(slide)
    textbox(slide, 2, 0.3, 9.3, 0.9, [("Proposta comercial", 36, False, INK, False)], PP_ALIGN.CENTER)
    card = slide.shapes.add_shape(1, Inches(4.2), Inches(1.4), Inches(4.9), Inches(5.1))
    card.fill.background()
    card.line.color.rgb = GRAY
    textbox(slide, 4.4, 1.5, 4.5, 0.5, [("{{plan_title}}", 16, False, INK, False)])
    textbox(slide, 4.4, 2.0, 4.5, 1.2, [("{{plan_description}}", 12, False, INK, False)], PP_ALIGN.JUSTIFY)
    textbox(slide, 4.4, 3.3, 4.5, 3.0, [("{{plan_items}}", 11, False, INK, False)])
    rectangle(slide, 5.2, 6.4, 2.9, 0.7, GRAY)
    textbox(slide, 5.35, 6.5, 2.6, 0.5, [("{{price}}", 20, True, WHITE, False)])

    # 4. Exclusions and notes
    slide = blank(prs)
    brand(slide)
    textbox(slide, 0.7, 0.5, 11, 0.6, [("Itens não incluídos nesta proposta", 22, False, INK, False)])
    textbox(slide, 0.7, 1.2, 11.5, 2.7, [("{{excluded_items}}", 16, False, INK, False)])
    textbox(slide, 0.7, 4.1, 11.8, 3.0, [("Observações importantes", 13, False, INK, True), ("{{notes}}", 13, False, INK, True)])
    rectangle(slide, 12.2, 5.9, 1.133, 1.6, GRAY)

    # 5. Closing
    slide = blank(prs)
    brand(slide)
    textbox(slide, 5.2, 1.9, 7.5, 2.6, [
        ("Permanecemos à disposição para esclarecer dúvidas e indicar a modalidade mais adequada conforme a complexidade do imóvel e o nível de acompanhamento desejado.", 15, False, INK, False),
        ("Após a aprovação da proposta, encaminharemos a formalização e a relação de documentos necessários para início.", 15, False, INK, False),
    ], PP_ALIGN.JUSTIFY)
    textbox(slide, 6.2, 5.5, 6.5, 1.3, [
        ("{{contact_phone}}", 14, True, INK, False),
        ("{{contact_site}}", 14, True, INK, False),
        ("{{contact_email}}", 14, True, INK, False),
    ])
    return prs


if __name__ == "__main__":
    OUT.parent.mkdir(exist_ok=True)
    build().save(OUT)
    print(f"wrote {OUT}")

"""What a plan holds once read: lines and texts in millimeters on paper, y up."""

from dataclasses import dataclass, field

PT_TO_MM = 25.4 / 72


@dataclass(frozen=True)
class Line:
    x1: float
    y1: float
    x2: float
    y2: float


@dataclass(frozen=True)
class Text:
    x: float
    y: float
    height: float
    value: str


@dataclass
class Plan:
    width: float
    height: float
    lines: list[Line] = field(default_factory=list)
    texts: list[Text] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


def scaled(plan: Plan, factor: float) -> Plan:
    """The plan at real size: every coordinate and text height times the drawing's scale denominator."""
    return Plan(
        width=plan.width * factor,
        height=plan.height * factor,
        lines=[
            Line(l.x1 * factor, l.y1 * factor, l.x2 * factor, l.y2 * factor)
            for l in plan.lines
        ],
        texts=[
            Text(t.x * factor, t.y * factor, t.height * factor, t.value)
            for t in plan.texts
        ],
        warnings=list(plan.warnings),
    )

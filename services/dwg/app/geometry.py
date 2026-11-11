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

"""The proposal's values: what the template's tags take, and the defaults."""

from pydantic import BaseModel, Field

SHORT = Field(default="", max_length=200)
LINES = Field(default_factory=list, max_length=20)

DEFAULT_EXCLUDED = [
    "execução de obras, instalações e adequações físicas;",
    "taxas, custas e despesas de terceiros;",
    "laudos específicos exigidos por norma ou por órgão fiscalizador, quando aplicáveis;",
    "alterações relevantes após o início dos serviços poderão demandar revisão de escopo e reorçamento.",
]

DEFAULT_CONTACT = {
    "contact_phone": "(47) 98867-5232",
    "contact_site": "www.mourasengenharia.com",
    "contact_email": "projetos@mourasengenharia.com",
}


class ProposalValues(BaseModel):
    """Body of POST /render. Every text is plain; the template decides the look."""

    model_config = {"extra": "forbid"}

    client: str = SHORT
    project_name: str = SHORT
    city_state: str = SHORT
    date: str = SHORT
    plan_title: str = SHORT
    plan_description: str = Field(default="", max_length=600)
    plan_items: list[str] = LINES
    price: str = Field(default="", max_length=40)
    excluded_items: list[str] = Field(default_factory=lambda: list(DEFAULT_EXCLUDED), max_length=20)
    notes: list[str] = LINES
    contact_phone: str = DEFAULT_CONTACT["contact_phone"]
    contact_site: str = DEFAULT_CONTACT["contact_site"]
    contact_email: str = DEFAULT_CONTACT["contact_email"]


def tag_values(values: ProposalValues) -> dict[str, str | list[str]]:
    """The values by tag. List entries get their marker: a check for plan items, a bullet for exclusions."""
    data = values.model_dump()
    data["plan_items"] = [f"☑ {item}" for item in values.plan_items]
    data["excluded_items"] = [f"• {item}" for item in values.excluded_items]
    return data

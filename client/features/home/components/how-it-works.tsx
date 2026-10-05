const STEPS = [
  {
    title: "Escolha o modelo",
    text: "Selecione o anexo do CBMSC que precisa preencher.",
  },
  {
    title: "Descreva o imóvel",
    text: "Converse com o assistente; ele extrai os dados para os campos.",
  },
  {
    title: "Revise e baixe",
    text: "Confira os campos e baixe o .docx com o layout original intacto.",
  },
];

export function HowItWorks() {
  return (
    <section className="rounded-xl border bg-muted/40 p-5 md:p-6">
      <h2 className="font-medium">Como o preenchimento funciona</h2>
      <ol className="mt-4 grid gap-4 text-sm md:grid-cols-3">
        {STEPS.map(({ title, text }, index) => (
          <li key={title} className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {index + 1}
            </span>
            <div>
              <p className="font-medium">{title}</p>
              <p className="text-muted-foreground">{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

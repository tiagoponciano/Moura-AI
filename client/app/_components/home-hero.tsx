export function HomeHero() {
  return (
    <section className="flex flex-col gap-3">
      <span className="text-sm font-medium text-primary">
        Moura Soluções em Engenharia
      </span>
      <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance md:text-4xl">
        Menos tempo em tarefas repetitivas, mais tempo em engenharia.
      </h1>
      <p className="max-w-2xl text-pretty text-muted-foreground">
        Assistentes para as rotinas dos projetos preventivos: preencher anexos
        do CBMSC, classificar edificações e redesenhar plantas antigas.
      </p>
    </section>
  );
}

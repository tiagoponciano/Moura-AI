const TITLE = "Moura Engenharia";

/** Centered product name; words start hidden and are revealed by the showcase entrance. */
export function HomeHero() {
  return (
    <section className="text-center">
      <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
        {TITLE.split(" ").map((word) => (
          <span
            key={word}
            data-animate="word"
            className="mr-[0.25em] inline-block last:mr-0 motion-safe:opacity-0"
          >
            {word}
          </span>
        ))}
      </h1>
      <p
        data-animate="subtitle"
        className="mt-2 text-lg text-muted-foreground motion-safe:opacity-0 sm:text-xl"
      >
        Projetos preventivos contra incêndio
      </p>
    </section>
  );
}

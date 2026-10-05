export function GenerationProblems({ problems }: { problems: string[] }) {
  if (problems.length === 0) return null;
  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
      <p className="font-medium">Corrija antes de gerar:</p>
      <ul className="mt-1 list-disc pl-4">
        {problems.map((problem) => (
          <li key={problem}>{problem}</li>
        ))}
      </ul>
    </div>
  );
}

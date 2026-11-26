export function ConversionNotice() {
  return (
    <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
      <p>
        <span className="font-medium text-foreground">Versão de testes.</span> O
        desenho sai com linhas e textos em uma só camada; confira no CAD antes
        de usar. O DXF é o arquivo mais confiável.
      </p>
    </div>
  );
}

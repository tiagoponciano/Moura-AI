import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MODULES, MODULE_STATUS_LABEL } from "@/lib/modules";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 md:px-8 md:py-14">
      <section className="flex flex-col gap-3">
        <span className="text-sm font-medium text-primary">
          Moura Soluções em Engenharia
        </span>
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance md:text-4xl">
          Menos tempo em tarefas repetitivas, mais tempo em engenharia.
        </h1>
        <p className="max-w-2xl text-muted-foreground text-pretty">
          Assistentes para as rotinas dos projetos preventivos: preencher anexos
          do CBMSC, classificar edificações e redesenhar plantas antigas.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {MODULES.map(({ href, label, summary, icon: Icon, status }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "group flex flex-col gap-4 rounded-xl border bg-card p-5 transition-colors",
              "hover:border-primary/40 hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
            )}
          >
            <div className="flex items-start justify-between">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-lg",
                  status === "soon"
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary/10 text-primary",
                )}
              >
                <Icon className="size-5" />
              </div>
              <Badge variant={status === "soon" ? "outline" : "secondary"}>
                {MODULE_STATUS_LABEL[status]}
              </Badge>
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <h2 className="font-medium">{label}</h2>
              <p className="text-sm text-muted-foreground">{summary}</p>
            </div>
            <span className="flex items-center gap-1 text-sm font-medium text-primary">
              {status === "soon" ? "Ver detalhes" : "Abrir"}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </section>

      <section className="rounded-xl border bg-muted/40 p-5 md:p-6">
        <h2 className="font-medium">Como o preenchimento funciona</h2>
        <ol className="mt-4 grid gap-4 text-sm md:grid-cols-3">
          {[
            [
              "Escolha o modelo",
              "Selecione o anexo do CBMSC que precisa preencher.",
            ],
            [
              "Descreva o imóvel",
              "Converse com o assistente; ele extrai os dados para os campos.",
            ],
            [
              "Revise e baixe",
              "Confira os campos e baixe o .docx com o layout original intacto.",
            ],
          ].map(([title, text], index) => (
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
    </div>
  );
}

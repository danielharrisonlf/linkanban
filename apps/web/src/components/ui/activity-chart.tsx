import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import type { PontoAtividade } from "../../types";
import { type ChartConfig, ChartContainer, ChartTooltipContent } from "./chart";

const config = {
  candidaturas: {
    label: "Candidaturas",
    color: "var(--color-accent)",
  },
} satisfies ChartConfig;

/**
 * Candidaturas por semana nas últimas 8 semanas.
 *
 * Uma série, uma cor: a leitura é a forma da curva. Eixo Y com passo inteiro —
 * "0,5 candidatura" não existe — e domínio calculado do dado, não fixo. Os mesmos
 * números vão numa lista para leitor de tela: gráfico não é acessível por natureza.
 */
export function ActivityChart({
  dados,
  className,
}: {
  dados: PontoAtividade[];
  className?: string;
}) {
  const vazio = dados.every((ponto) => ponto.candidaturas === 0);
  const maximo = dados.reduce((maior, ponto) => Math.max(maior, ponto.candidaturas), 0);

  if (vazio) {
    return (
      <div className={className}>
        <p className="py-8 text-center text-label text-ink-tertiary">
          Nenhuma candidatura registrada nas últimas 8 semanas.
        </p>
        <ListaAcessivel dados={dados} />
      </div>
    );
  }

  const topo = Math.max(1, Math.ceil(maximo * 1.15));

  return (
    <div className={className}>
      <ChartContainer config={config} className="h-44 w-full">
        <AreaChart data={dados} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
          <defs>
            <linearGradient id="fill-candidaturas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.01} />
            </linearGradient>
          </defs>

          <CartesianGrid vertical={false} stroke="var(--color-line-subtle)" />

          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={4} />
          <YAxis
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={32}
            domain={[0, topo]}
            ticks={Array.from({ length: topo + 1 }, (_, indice) => indice)}
          />

          <Tooltip
            cursor={{ stroke: "var(--color-line)" }}
            content={<ChartTooltipContent indicator="line" />}
          />

          <Area
            dataKey="candidaturas"
            type="monotone"
            stroke="var(--color-accent)"
            strokeWidth={2}
            fill="url(#fill-candidaturas)"
            dot={{ r: 2.5, fill: "var(--color-accent)", strokeWidth: 0 }}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ChartContainer>

      <ListaAcessivel dados={dados} />
    </div>
  );
}

/**
 * Equivalente textual do gráfico. Usa lista de descrição, não `<table>`: uma
 * tabela com `sr-only` (largura 1px) tem min-content maior que a viewport e
 * empurra a página na horizontal a 320px.
 */
function ListaAcessivel({ dados }: { dados: PontoAtividade[] }) {
  return (
    <dl className="apenas-leitor">
      <dt>Candidaturas por semana nas últimas 8 semanas</dt>
      {dados.map((ponto) => (
        <dd key={ponto.semana}>
          Semana de {ponto.label}: {ponto.candidaturas}
        </dd>
      ))}
    </dl>
  );
}

import { useMemo } from 'react';
import { sankey as d3Sankey, sankeyLinkHorizontal } from 'd3-sankey';
import type { YearMetrics } from '../../engine/types';
import { INSTITUTION_COLORS, ROLE_COLORS } from '../../theme';

interface Props {
  metric: YearMetrics | undefined;
  year: number;
}

interface NodeDatum {
  name: string;
  color: string;
}
interface LinkDatum {
  source: number;
  target: number;
  value: number;
  color: string;
}

export function SankeyFlow({ metric, year }: Props) {
  const layout = useMemo(() => {
    if (!metric) return null;
    return buildLayout(metric);
  }, [metric]);

  return (
    <div className="h-full rounded-xl border border-econ-border bg-econ-card p-5 shadow-card">
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <h3 className="text-sm font-semibold">Money flows</h3>
          <p className="font-mono text-[11px] text-econ-muted">
            firms → income → taxes & consumption → back to firms
          </p>
        </div>
        <span className="font-mono text-xs text-econ-muted">Year {year}</span>
      </div>
      <div className="relative h-[280px] w-full overflow-hidden">
        {layout ? (
          <svg
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            preserveAspectRatio="none"
            className="h-full w-full"
          >
            {layout.links.map((link, i) => (
              <path
                key={i}
                d={link.path ?? ''}
                fill="none"
                stroke={link.stroke}
                strokeOpacity={0.35}
                strokeWidth={Math.max(1, link.width ?? 0)}
              />
            ))}
            {layout.nodes.map((n, i) => (
              <g key={i}>
                <rect
                  x={n.x0}
                  y={n.y0}
                  width={(n.x1 ?? 0) - (n.x0 ?? 0)}
                  height={(n.y1 ?? 0) - (n.y0 ?? 0)}
                  fill={n.color}
                  rx={2}
                />
                <text
                  x={(n.x1 ?? 0) < layout.width / 2 ? (n.x1 ?? 0) + 6 : (n.x0 ?? 0) - 6}
                  y={((n.y0 ?? 0) + (n.y1 ?? 0)) / 2}
                  dy="0.35em"
                  textAnchor={(n.x1 ?? 0) < layout.width / 2 ? 'start' : 'end'}
                  fontSize={10}
                  fill="#1E1C18"
                  fontFamily="IBM Plex Sans, sans-serif"
                >
                  {n.name}
                </text>
              </g>
            ))}
          </svg>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-econ-muted">
            No flows yet.
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * d3-sankey cannot handle cycles. The money-flow graph has natural cycles
 * (Firms → Workers → Firms via consumption; Workers → State → Workers via
 * welfare). We break cycles by laying out four strict left-to-right layers:
 *
 *   Firms (pay) → Workers / Capitalists → State → Firms (receive)
 *
 * Welfare is folded into the single State → Firms edge (treating it as
 * "public spending that ends up at firms via recipient consumption").
 * Wages and surplus split left-to-middle; consumption and public spending
 * converge on the right-side Firms node.
 */
function buildLayout(metric: YearMetrics) {
  const width = 800;
  const height = 280;

  // Layer 0: firms (paying). Layer 1: workers, capitalists. Layer 2: state.
  // Layer 3: firms (receiving).
  const FIRMS_SRC = 0;
  const WORKERS = 1;
  const CAPITALISTS = 2;
  const STATE = 3;
  const FIRMS_SINK = 4;

  const nodes: NodeDatum[] = [
    { name: 'Firms', color: INSTITUTION_COLORS.firm },
    { name: 'Workers', color: ROLE_COLORS.worker },
    { name: 'Capitalists', color: ROLE_COLORS.capitalist },
    { name: 'State', color: INSTITUTION_COLORS.state },
    { name: 'Firms', color: INSTITUTION_COLORS.firm },
  ];

  const f = metric.flows;
  // Consumption is split between workers and capitalists roughly by their
  // wage+surplus income share. Public spending (welfare + investment) is
  // routed through the single State → Firms edge.
  const incomeWorkers = Math.max(0, f.totalWages);
  const incomeCapitalists = Math.max(0, f.totalPrivateSurplus);
  const totalIncome = incomeWorkers + incomeCapitalists;
  const workerConsumption =
    totalIncome > 0 ? f.totalConsumption * (incomeWorkers / totalIncome) : f.totalConsumption * 0.5;
  const capitalistConsumption = Math.max(0, f.totalConsumption - workerConsumption);
  const publicSpending = Math.max(
    0,
    f.totalPublicInvestment + f.totalWelfare + f.totalEssentialsSubsidy,
  );

  const rawLinks: LinkDatum[] = [
    // Firms distribute wages and surplus
    { source: FIRMS_SRC, target: WORKERS, value: f.totalWages, color: ROLE_COLORS.worker },
    {
      source: FIRMS_SRC,
      target: CAPITALISTS,
      value: f.totalPrivateSurplus,
      color: ROLE_COLORS.capitalist,
    },
    {
      source: FIRMS_SRC,
      target: STATE,
      value: f.totalPublicSurplus,
      color: INSTITUTION_COLORS.state,
    },
    // Taxes flow to state
    { source: WORKERS, target: STATE, value: f.totalIncomeTax, color: INSTITUTION_COLORS.state },
    { source: CAPITALISTS, target: STATE, value: f.totalProfitTax, color: INSTITUTION_COLORS.state },
    // Household consumption flows to firms
    {
      source: WORKERS,
      target: FIRMS_SINK,
      value: workerConsumption,
      color: ROLE_COLORS.worker,
    },
    {
      source: CAPITALISTS,
      target: FIRMS_SINK,
      value: capitalistConsumption,
      color: ROLE_COLORS.capitalist,
    },
    // State spending (welfare transfers + public investment + essentials subsidy)
    // ultimately lands at firms via recipient consumption.
    {
      source: STATE,
      target: FIRMS_SINK,
      value: publicSpending,
      color: INSTITUTION_COLORS.state,
    },
  ];

  // d3-sankey cannot solve if all values are zero. Skip links below a floor
  // and bail out if the whole graph is empty.
  const filteredLinks = rawLinks.filter((l) => l.value > 1);
  if (filteredLinks.length === 0) return null;

  const sankeyGen = d3Sankey<NodeDatum, LinkDatum>()
    .nodeWidth(10)
    .nodePadding(16)
    .extent([
      [16, 16],
      [width - 16, height - 16],
    ]);

  const graphNodes = nodes.map((n) => ({ ...n }));
  const graphLinks = filteredLinks.map((l) => ({ ...l }));
  try {
    const graph = sankeyGen({ nodes: graphNodes, links: graphLinks });
    const linkPath = sankeyLinkHorizontal();
    const drawnLinks = graph.links.map((l) => ({
      path: linkPath(l) ?? '',
      width: l.width ?? 0,
      stroke: (l as unknown as { color: string }).color,
    }));
    return {
      width,
      height,
      nodes: graph.nodes as Array<
        NodeDatum & { x0?: number; x1?: number; y0?: number; y1?: number }
      >,
      links: drawnLinks,
    };
  } catch {
    return null;
  }
}

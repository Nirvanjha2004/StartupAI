interface AgentTimelineProps {
  agents: string[]
}

const AGENT_COLORS: Record<string, string> = {
  planner:    { bg: 'rgba(167,139,250,0.12)', text: '#a78bfa', border: 'rgba(167,139,250,0.2)' } as unknown as string,
  researcher: { bg: 'rgba(96,165,250,0.12)',  text: '#60a5fa', border: 'rgba(96,165,250,0.2)'  } as unknown as string,
  enricher:   { bg: 'rgba(52,211,153,0.12)',  text: '#34d399', border: 'rgba(52,211,153,0.2)'  } as unknown as string,
  writer:     { bg: 'rgba(245,158,11,0.12)',  text: '#f59e0b', border: 'rgba(245,158,11,0.2)'  } as unknown as string,
  critic:     { bg: 'rgba(244,114,182,0.12)', text: '#f472b6', border: 'rgba(244,114,182,0.2)' } as unknown as string,
}

type AgentColorEntry = { bg: string; text: string; border: string }

function getColors(agent: string): AgentColorEntry {
  return (AGENT_COLORS[agent.toLowerCase()] as unknown as AgentColorEntry) || {
    bg: 'rgba(113,113,122,0.12)',
    text: '#71717a',
    border: 'rgba(113,113,122,0.2)',
  }
}

export default function AgentTimeline({ agents }: AgentTimelineProps) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {agents.map((agent, i) => {
        const c = getColors(agent)
        return (
          <span key={agent} className="flex items-center gap-1">
            <span
              className="px-2 py-0.5 rounded-md text-[11px] font-medium capitalize"
              style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
            >
              {agent}
            </span>
            {i < agents.length - 1 && (
              <span className="text-zinc-700 text-xs">→</span>
            )}
          </span>
        )
      })}
    </div>
  )
}

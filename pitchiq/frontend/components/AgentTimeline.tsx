interface AgentTimelineProps {
  agents: string[]
}

export default function AgentTimeline({ agents }: AgentTimelineProps) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {agents.map((agent, i) => (
        <span key={agent} className="flex items-center gap-1">
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#22c55e33] text-[#22c55e] capitalize">
            {agent}
          </span>
          {i < agents.length - 1 && (
            <span className="text-[#444] text-xs">→</span>
          )}
        </span>
      ))}
    </div>
  )
}

interface CriticScoreProps {
  score: number
  feedback: string
}

export default function CriticScore({ score, feedback }: CriticScoreProps) {
  const color =
    score >= 8.5
      ? 'text-[#22c55e]'
      : score >= 6
      ? 'text-[#eab308]'
      : 'text-[#ef4444]'

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-1">
        <span className={`text-3xl font-bold ${color}`}>{score.toFixed(1)}</span>
        <span className="text-[#555] text-sm">/ 10</span>
      </div>
      {feedback && (
        <p className="text-[#666] text-sm leading-relaxed">{feedback}</p>
      )}
    </div>
  )
}

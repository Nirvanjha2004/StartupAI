interface CriticScoreProps {
  score: number
  feedback: string
}

export default function CriticScore({ score, feedback }: CriticScoreProps) {
  const color =
    score >= 8.5 ? 'text-emerald-400' :
    score >= 6   ? 'text-amber-400'   : 'text-red-400'

  const ringColor =
    score >= 8.5 ? 'border-emerald-500/30' :
    score >= 6   ? 'border-amber-500/30'   : 'border-red-500/30'

  return (
    <div className="space-y-3">
      <div className={`inline-flex items-baseline gap-1 px-3 py-1.5 rounded-xl border ${ringColor} bg-white/[0.03]`}>
        <span className={`text-3xl font-bold tabular-nums ${color}`}>{score.toFixed(1)}</span>
        <span className="text-zinc-600 text-sm">/10</span>
      </div>
      {feedback && (
        <p className="text-zinc-500 text-sm leading-relaxed">{feedback}</p>
      )}
    </div>
  )
}

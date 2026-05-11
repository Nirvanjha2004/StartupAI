interface StatsCardProps {
  label: string
  value: string
  sub?: string
}

export default function StatsCard({ label, value, sub }: StatsCardProps) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
      <p className="text-[#555] text-xs uppercase tracking-wider mb-2">{label}</p>
      <p className="text-white text-2xl font-semibold">{value}</p>
      {sub && <p className="text-[#555] text-xs mt-1">{sub}</p>}
    </div>
  )
}

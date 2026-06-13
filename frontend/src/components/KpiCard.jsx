export default function KpiCard({ title, value, change, unit = "", icon }) {
  const isPositive = change >= 0;
  const changeColor = isPositive ? "text-emerald-600" : "text-red-600";
  const changeBg    = isPositive ? "bg-emerald-50"    : "bg-red-50";

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-mint flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-forest/50">{title}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-forest">
        {unit}{typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {change !== undefined && (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full self-start ${changeColor} ${changeBg}`}>
          {isPositive ? "▲" : "▼"} {Math.abs(change)}% vs prior period
        </span>
      )}
    </div>
  );
}

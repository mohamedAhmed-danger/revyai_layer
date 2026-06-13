const SEVERITY_STYLES = {
  high:   "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low:    "bg-blue-100 text-blue-700 border-blue-200",
};

const TYPE_LABELS = {
  revenue_drop:  "Revenue Drop",
  claim_spike:   "Claim Spike",
  booking_drop:  "Booking Drop",
};

export default function AnomalyBadge({ anomaly }) {
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${SEVERITY_STYLES[anomaly.severity]}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="animate-pulse-dot w-2 h-2 rounded-full bg-current inline-block" />
        <span className="font-semibold">{anomaly.branch_name}</span>
        <span className="ml-auto text-xs opacity-70 uppercase tracking-wide">
          {TYPE_LABELS[anomaly.type] || anomaly.type}
        </span>
      </div>
      <p className="opacity-80 leading-snug">{anomaly.description}</p>
    </div>
  );
}

import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement,
  LineElement, Tooltip, Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

export default function RevenueChart({ trend }) {
  if (!trend || trend.length === 0) return null;

  // Sample every 3 days for readability
  const sampled = trend.filter((_, i) => i % 3 === 0);

  const labels = sampled.map((d) => {
    const dt = new Date(d.date);
    return `${dt.toLocaleString("default", { month: "short" })} ${dt.getDate()}`;
  });
  const values = sampled.map((d) => d.revenue);

  const data = {
    labels,
    datasets: [
      {
        label: "Daily Revenue (EGP)",
        data: values,
        borderColor: "#1a3a2a",
        backgroundColor: "rgba(26,58,42,0.08)",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { mode: "index", intersect: false } },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 10, font: { size: 11 } } },
      y: {
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: { callback: (v) => `${(v / 1000).toFixed(0)}k`, font: { size: 11 } },
      },
    },
  };

  return (
    <div style={{ height: 220 }}>
      <Line data={data} options={options} />
    </div>
  );
}

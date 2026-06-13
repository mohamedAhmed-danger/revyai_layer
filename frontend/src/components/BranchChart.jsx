import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function BranchChart({ branches }) {
  if (!branches || branches.length === 0) return null;

  const labels = branches.map((b) => b.branch_name.split("–")[0].trim());
  const values = branches.map((b) => b.revenue);
  const maxRev = Math.max(...values);

  const backgroundColors = branches.map((b) =>
    b.revenue === Math.min(...values) ? "#dc2626" :
    b.revenue === maxRev              ? "#1a3a2a" :
    "#c9922a"
  );

  const data = {
    labels,
    datasets: [{ data: values, backgroundColor: backgroundColors, borderRadius: 6, borderSkipped: false }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: {
      callbacks: { label: (ctx) => ` EGP ${ctx.raw.toLocaleString()}` },
    }},
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: {
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: { callback: (v) => `${(v / 1000).toFixed(0)}k`, font: { size: 11 } },
      },
    },
  };

  return (
    <div style={{ height: 200 }}>
      <Bar data={data} options={options} />
    </div>
  );
}

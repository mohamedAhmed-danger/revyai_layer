const BASE = "";  // uses proxy → http://localhost:5000

export async function fetchDashboard(period = "last_30") {
  const res = await fetch(`${BASE}/dashboard?period=${period}`);
  if (!res.ok) throw new Error("Failed to fetch dashboard");
  return res.json();
}

export async function fetchInsights() {
  const res = await fetch(`${BASE}/insights`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to fetch insights");
  return res.json();
}

export async function sendChatMessage(question) {
  const res = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error("Failed to send message");
  return res.json();
}

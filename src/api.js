// ═══════════════════════════════════════════════════════════
//  CINDYMARY COUTURE — API Client
//  Connects to Railway backend via VITE_API_URL
// ═══════════════════════════════════════════════════════════

const BASE = import.meta.env.VITE_API_URL || "";

// ── Core fetch wrapper ──────────────────────────────────────
async function req(path, options = {}, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Auth ─────────────────────────────────────────────────────
export const api = {

  // Health check
  health: () => req("/health"),

  // Login — returns { token, user }
  login: (email, password) =>
    req("/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  // ── Orders ─────────────────────────────────────────────────
  // Get all orders (admin) or own order (client)
  getOrders: (token) => req("/orders", {}, token),

  // Single order with full detail
  getOrder: (id, token) => req(`/orders/${id}`, {}, token),

  // Create new order (admin only)
  createOrder: (data, token) =>
    req("/orders", { method: "POST", body: JSON.stringify(data) }, token),

  // Advance to next stage (admin only)
  advanceStage: (id, token) =>
    req(`/orders/${id}/advance`, { method: "PATCH" }, token),

  // Add delay to a stage (admin only)
  addDelay: (id, stageId, days, reason, token) =>
    req(`/orders/${id}/delay`, {
      method: "PATCH",
      body: JSON.stringify({ stage_id: stageId, days, reason }),
    }, token),

  // Assign tailor (admin only)
  assign: (id, assignedTo, token) =>
    req(`/orders/${id}/assign`, {
      method: "PATCH",
      body: JSON.stringify({ assigned_to: assignedTo }),
    }, token),

  // ── Notifications ───────────────────────────────────────────
  getNotifications: (orderId, token) =>
    req(`/orders/${orderId}/notifications`, {}, token),

  // ── Admin stats ─────────────────────────────────────────────
  getStats: (token) => req("/admin/stats", {}, token),

  // ── Stages reference ────────────────────────────────────────
  getStages: () => req("/stages"),
};

export default api;

import { api } from "@/lib/api";
import type { PaymentFeed, StatsReport } from "@/lib/types";

export function listPayments(
  token: string,
  params: { limit?: number; q?: string; since?: string; until?: string; source?: string } = {},
  employee = false,
) {
  const search = new URLSearchParams();
  if (params.limit) search.set("limit", String(params.limit));
  if (params.q) search.set("q", params.q);
  if (params.since) search.set("since", params.since);
  if (params.until) search.set("until", params.until);
  if (params.source) search.set("source", params.source);
  const query = search.toString();
  const path = employee ? "/v1/employee/payments" : "/v1/payments";
  return api<PaymentFeed>(query ? `${path}?${query}` : path, token);
}

export function getStats(token: string, year: number, month?: number) {
  const search = new URLSearchParams({ year: String(year) });
  if (month) search.set("month", String(month));
  return api<StatsReport>(`/v1/payments/stats?${search}`, token);
}

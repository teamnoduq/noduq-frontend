import { api } from "@/lib/api";
import type { PaymentFeed } from "@/lib/types";

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

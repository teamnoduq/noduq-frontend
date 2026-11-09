import { api, apiSocketUrl } from "@/lib/api";
import type { PaymentFeed, StatsReport } from "@/lib/types";

export function listPayments(
  token: string,
  params: {
    limit?: number;
    q?: string;
    since?: string;
    until?: string;
    source?: string;
    before?: string;
    beforeId?: string;
    offset?: number;
  } = {},
  employee = false,
) {
  const search = new URLSearchParams();
  if (params.limit) search.set("limit", String(params.limit));
  if (params.q) search.set("q", params.q);
  if (params.since) search.set("since", params.since);
  if (params.until) search.set("until", params.until);
  if (params.source) search.set("source", params.source);
  if (params.before) search.set("before", params.before);
  if (params.beforeId) search.set("beforeId", params.beforeId);
  if (params.offset) search.set("offset", String(params.offset));
  const query = search.toString();
  const path = employee ? "/v1/employee/payments" : "/v1/payments";
  return api<PaymentFeed>(query ? `${path}?${query}` : path, token);
}

export type PaymentHistory = {
  status: string;
  windowFrom?: string | null;
  windowUntil?: string | null;
  total: number;
  processed: number;
  stored: number;
  percent: number;
  finishedAt?: string | null;
  earliestAt?: string | null;
  paymentCount?: number;
  lastStoredAt?: string | null;
};

export function getPaymentHistory(token: string) {
  return api<PaymentHistory>("/v1/payments/history", token);
}

export function startPaymentHistory(token: string) {
  return api<PaymentHistory>("/v1/payments/history/start", token, { method: "POST" });
}

export function deferPaymentHistory(token: string) {
  return api<PaymentHistory>("/v1/payments/history/defer", token, { method: "POST" });
}

/** Keeps the open desk in sync. The callback runs when a payment lands. */
export function watchPayments(token: string, onPayment: () => void): () => void {
  let stopped = false;
  let socket: WebSocket | null = null;
  let wait = 1000;
  let retry = 0;
  let pending = 0;

  const open = () => {
    if (stopped) return;
    const next = new WebSocket(apiSocketUrl("/v1/payments/history/live", token));
    socket = next;
    next.onopen = () => {
      wait = 1000;
    };
    next.onmessage = (message) => {
      let body: { event?: string } | null = null;
      try {
        body = JSON.parse(String(message.data)) as { event?: string };
      } catch {
        return;
      }
      if (body?.event !== "payment") return;
      window.clearTimeout(pending);
      pending = window.setTimeout(onPayment, 200);
    };
    next.onclose = () => {
      if (stopped || socket !== next) return;
      retry = window.setTimeout(open, wait);
      wait = Math.min(wait * 2, 8000);
    };
  };

  open();
  return () => {
    stopped = true;
    window.clearTimeout(retry);
    window.clearTimeout(pending);
    socket?.close();
  };
}

export function getStats(token: string, year: number, month?: number, all = false) {
  const search = new URLSearchParams();
  if (all) {
    search.set("scope", "all");
  } else {
    search.set("year", String(year));
    if (month) search.set("month", String(month));
  }
  return api<StatsReport>(`/v1/payments/stats?${search}`, token);
}

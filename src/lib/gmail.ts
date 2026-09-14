import { api } from "@/lib/api";

export type GmailStatus = {
  configured: boolean;
  connected: boolean;
  address: string | null;
};

export function gmailStatus(token: string) {
  return api<GmailStatus>("/v1/gmail", token);
}

export function gmailConnect(token: string) {
  return api<{ authorizationUrl: string }>("/v1/gmail/connect?returnTo=web", token);
}

export function gmailDisconnect(token: string) {
  return api<void>("/v1/gmail", token, { method: "DELETE" });
}

const APP_SCHEME = "com.noduq.app";
const APP_HOST = "email-callback";

export function authTypeFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return search.get("type") ?? hash.get("type");
}

export function noduqAppAuthHref(params: {
  accessToken?: string | null;
  refreshToken?: string | null;
  type: string;
  email?: string | null;
}): string {
  const query = new URLSearchParams();
  if (params.accessToken) query.set("access_token", params.accessToken);
  if (params.refreshToken) query.set("refresh_token", params.refreshToken);
  query.set("type", params.type);
  if (params.email) query.set("email", params.email);
  return `${APP_SCHEME}://${APP_HOST}?${query.toString()}`;
}

export function openNoduqApp(href: string) {
  window.location.assign(href);
}

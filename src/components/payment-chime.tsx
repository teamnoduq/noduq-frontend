"use client";

import { useAuth } from "@/components/auth-provider";
import { announcePayment, primePaymentSound, resumePaymentSound } from "@/lib/payment-sound";
import { listPayments, watchPayments } from "@/lib/payments";
import { useEffect } from "react";

const BEAT = "noduq-chime-beat";
const MAX_GAP = 3 * 60 * 60 * 1000;
const MIN_GAP = 5000;

export function PaymentChime() {
  const { accessToken, kind } = useAuth();
  const employee = kind === "employee";

  useEffect(() => {
    const arm = () => primePaymentSound();
    window.addEventListener("pointerdown", arm);
    window.addEventListener("keydown", arm);
    return () => {
      window.removeEventListener("pointerdown", arm);
      window.removeEventListener("keydown", arm);
    };
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    let since = Date.now();
    const replay = (from: number) => {
      const gap = Date.now() - from;
      if (gap < MIN_GAP || gap > MAX_GAP) return;
      const token = accessToken;
      void listPayments(token, { since: new Date(from).toISOString(), limit: 8 }, employee)
        .then((feed) => {
          const fresh = feed.notices.filter((notice) => notice.id).slice(0, 3).reverse();
          for (const notice of fresh) {
            announcePayment(notice.id, notice.amount);
          }
        })
        .catch(() => {});
    };

    const beat = Number(window.sessionStorage.getItem(BEAT) || 0);
    if (beat) replay(beat);
    const mark = window.setInterval(() => {
      window.sessionStorage.setItem(BEAT, String(Date.now()));
    }, 15000);
    window.sessionStorage.setItem(BEAT, String(Date.now()));

    const onWake = () => {
      if (document.visibilityState === "hidden") {
        since = Date.now();
        return;
      }
      resumePaymentSound();
      replay(since);
      since = Date.now();
    };
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("online", onWake);

    const stop = watchPayments(
      accessToken,
      (ping) => {
        since = Date.now();
        announcePayment(ping.id || `pago-${Date.now()}`, ping.amount ?? null);
      },
      {
        immediate: true,
        onReconnect: (closedAt) => replay(closedAt - 5000),
      },
    );

    return () => {
      stop();
      window.clearInterval(mark);
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("online", onWake);
    };
  }, [accessToken, employee]);

  return null;
}

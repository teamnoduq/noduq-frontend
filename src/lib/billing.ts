"use client";

import { Purchases } from "@revenuecat/purchases-js";

const apiKey = process.env.NEXT_PUBLIC_REVENUECAT_API_KEY?.trim() ?? "";

export function billingConfigured(): boolean {
  return apiKey.length > 0;
}

export async function purchaseAndroidPlan(appUserId: string): Promise<void> {
  if (!apiKey) {
    throw new Error("Falta NEXT_PUBLIC_REVENUECAT_API_KEY.");
  }
  const purchases = Purchases.isConfigured()
    ? Purchases.getSharedInstance()
    : Purchases.configure({ apiKey, appUserId });
  await purchases.changeUser(appUserId);
  const offerings = await purchases.getOfferings();
  const packages = offerings.current?.availablePackages ?? [];
  const pkg =
    packages.find((item) => String(item.packageType).toLowerCase() === "monthly") ?? packages[0];
  if (!pkg) {
    throw new Error("RevenueCat todavía no tiene el paquete mensual.");
  }
  await purchases.purchase({ rcPackage: pkg });
}

import { NextResponse } from "next/server";

import {
  grantSubscriptionCredits,
  listCreditAccounts,
  listCreditTransactions,
} from "@/lib/billing-service";
import { requireAdmin } from "@/lib/request-auth";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const [accounts, transactions] = await Promise.all([listCreditAccounts(), listCreditTransactions()]);
    return NextResponse.json({ accounts, transactions }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const body = await request.json();
    if (!body.subscription_id) throw new Error("SUBSCRIPTION_REQUIRED");
    const balance = await grantSubscriptionCredits(body.subscription_id, admin.id);
    return NextResponse.json({ balance });
  } catch {
    return NextResponse.json({ error: "Unable to grant subscription credits" }, { status: 400 });
  }
}

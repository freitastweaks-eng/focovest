import crypto from "node:crypto";
import { getSupabaseAdmin } from "./supabase-server";
import { createSubscription, getPlanById } from "@/lib/subscription";
import type { Database } from "@/integrations/supabase/types";

const LOFYPAY_BASE_URL = process.env.LOFYPAY_BASE_URL ?? "https://app.lofypay.com/api/v1";
const LOFYPAY_SECRET = process.env.LOFYPAY_SECRET_KEY ?? process.env.LOFYPAY_SECRET;
const LOFYPAY_WEBHOOK_SECRET =
  process.env.LOFYPAY_WEBHOOK_SECRET ??
  process.env.LOFYPAY_SECRET_KEY ??
  process.env.LOFYPAY_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL;

function jsonResponse(payload: unknown, status = 200, headers?: Record<string, string>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json", ...(headers ?? {}) },
  });
}

function methodNotAllowed() {
  return jsonResponse({ status: "error", message: "Method not allowed." }, 405);
}

function badRequest(message: string) {
  return jsonResponse({ status: "error", message }, 400);
}

function unauthorized(message = "Unauthorized.") {
  return jsonResponse({ status: "error", message }, 401);
}

function forbidden(message = "Forbidden.") {
  return jsonResponse({ status: "error", message }, 403);
}

function notFound(message = "Not found.") {
  return jsonResponse({ status: "error", message }, 404);
}

function serverError(message = "Internal server error.") {
  return jsonResponse({ status: "error", message }, 500);
}

function getBearerToken(value: string | null): string | null {
  if (!value) return null;
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

async function parseJsonBody(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getLofyPayApiKey() {
  if (!LOFYPAY_SECRET) {
    throw new Error("Missing LOFYPAY_SECRET environment variable.");
  }
  return LOFYPAY_SECRET;
}

function getWebhookSecret() {
  if (!LOFYPAY_WEBHOOK_SECRET) {
    throw new Error("Missing LOFYPAY_WEBHOOK_SECRET environment variable.");
  }
  return LOFYPAY_WEBHOOK_SECRET;
}

function getSupabaseUrl() {
  if (!SUPABASE_URL) {
    throw new Error("Missing SUPABASE_URL environment variable.");
  }
  return SUPABASE_URL;
}

function isValidDocument(document: unknown): document is string {
  return typeof document === "string" && /^[0-9]{11,14}$/.test(document.replace(/\D/g, ""));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNestedRecord(
  value: Record<string, unknown>,
  key: string,
): Record<string, unknown> | null {
  const nested = value[key];
  return isRecord(nested) ? nested : null;
}

function getString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeLofyPayPayload(payload: unknown): Record<string, unknown> | null {
  if (Array.isArray(payload)) {
    return normalizeLofyPayPayload(payload[0]);
  }

  if (!isRecord(payload)) {
    return null;
  }

  const nestedKeys = ["data", "payment", "transaction", "result"];
  for (const key of nestedKeys) {
    const nested = normalizeLofyPayPayload(payload[key]);
    if (nested) {
      return { ...payload, ...nested };
    }
  }

  return payload;
}

function normalizePaymentStatus(status: string) {
  const normalized = status.trim().toLowerCase();
  if (["paid", "approved", "payment.approved", "succeeded", "completed"].includes(normalized)) {
    return "PAID";
  }
  if (["expired", "canceled", "cancelled", "failed", "refused"].includes(normalized)) {
    return normalized.toUpperCase();
  }
  return "WAITING";
}

function getNotificationUrl(origin: string) {
  const configuredUrl = process.env.LOFYPAY_NOTIFICATION_URL;
  if (configuredUrl) {
    return configuredUrl;
  }

  const originUrl = new URL(origin);
  const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(originUrl.hostname);
  if (originUrl.protocol !== "https:" || isLocalHost) {
    return "";
  }

  return `${originUrl.origin}/api/webhook/lofypay`;
}

function extractPaymentId(payload: Record<string, unknown>) {
  return (
    getString(payload.id) ||
    getString(payload.payment_id) ||
    getString(payload.paymentId) ||
    getString(payload.idTransaction) ||
    getString(payload.transactionId) ||
    getString(payload.transaction_id)
  );
}

function extractIdTransaction(payload: Record<string, unknown>) {
  return getString(payload.idtransaction) || extractPaymentId(payload);
}

function getIdTransactionField(value: Record<string, unknown>) {
  const id = value.idtransaction ?? value.idTransaction;
  return typeof id === "string" ? id.trim() : "";
}

function extractPixCode(payload: Record<string, unknown>) {
  return (
    getString(payload.pix_qr_code) ||
    getString(payload.pixQrCode) ||
    getString(payload.qr_code) ||
    getString(payload.qrCode) ||
    getString(payload.qrcode) ||
    getString(payload.brcode) ||
    getString(payload.brCode) ||
    getString(payload.copyPaste) ||
    getString(payload.copiaCola) ||
    getString(payload.paymentCode) ||
    getString(payload.emv)
  );
}

function extractPixImage(payload: Record<string, unknown>) {
  return (
    getString(payload.pix_qr_code_base64) ||
    getString(payload.pixQrCodeBase64) ||
    getString(payload.pix_qr_image) ||
    getString(payload.qr_code_base64) ||
    getString(payload.qrCodeBase64) ||
    getString(payload.qrcodeBase64) ||
    getString(payload.qrcode_image) ||
    getString(payload.qrcodeImage) ||
    getString(payload.paymentCodeBase64)
  );
}

function verifyLofyPaySignature(rawBody: string, signatureHeader: string | null) {
  if (!signatureHeader) return false;
  const parts = new Map(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=").map((item) => item.trim());
      return [key, value];
    }),
  );
  const timestamp = Number(parts.get("t"));
  const signature = parts.get("v1");
  if (!Number.isFinite(timestamp) || !signature) return false;
  if (Math.abs(Date.now() / 1000 - timestamp) > 300) return false;

  const expected = crypto
    .createHmac("sha256", getWebhookSecret())
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function getSupabaseUserFromAccessToken(accessToken: string | null) {
  if (!accessToken) return null;

  const authUrl = `${getSupabaseUrl()}/auth/v1/user`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };

  if (process.env.SUPABASE_PUBLISHABLE_KEY) {
    headers.apikey = process.env.SUPABASE_PUBLISHABLE_KEY;
  }

  const response = await fetch(authUrl, { method: "GET", headers });
  if (!response.ok) return null;

  return (await response.json()) as { id: string; email?: string };
}

async function getRequestUser(request: Request) {
  const accessToken = getBearerToken(request.headers.get("authorization"));
  return getSupabaseUserFromAccessToken(accessToken);
}

async function callLofyPay(path: string, options?: { method?: string; body?: unknown }) {
  const method = options?.method ?? "POST";
  const baseUrl = LOFYPAY_BASE_URL.endsWith("/") ? LOFYPAY_BASE_URL : `${LOFYPAY_BASE_URL}/`;
  const url = new URL(path.replace(/^\/+/, ""), baseUrl).toString();
  const apiKey = getLofyPayApiKey();
  const requestBody = options?.body;

  const response = await fetch(url, {
    method,
    redirect: "manual",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: requestBody === undefined ? undefined : JSON.stringify(requestBody),
  });

  const rawText = await response.text();
  let payload: unknown = null;
  try {
    payload = rawText ? JSON.parse(rawText) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    console.error("LOFYPAY STATUS:", response.status);
    console.error("LOFYPAY RAW:", rawText);
  }

  return { response, payload, rawText } as const;
}

async function saveTransaction(payload: {
  user_id: string;
  external_reference: string;
  plan_id: string;
  amount: number;
  status: string;
  id_transaction: string;
  payment_code: string;
  payment_code_base64: string;
  notification_url: string;
  paid_at?: string | null;
}) {
  const db = getSupabaseAdmin();
  const { data, error } = await db.from("lofypay_transactions").upsert(
    {
      user_id: payload.user_id,
      external_reference: payload.external_reference,
      plan_id: payload.plan_id,
      amount: payload.amount,
      status: payload.status,
      id_transaction: payload.id_transaction,
      payment_code: payload.payment_code,
      payment_code_base64: payload.payment_code_base64,
      notification_url: payload.notification_url,
      paid_at: payload.paid_at || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "external_reference" },
  );

  if (error) {
    console.error("Failed to save LofyPay transaction:", error.message);
    throw new Error("Failed to record transaction.");
  }

  return data;
}

async function getTransactionById(idTransaction: string) {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("lofypay_transactions")
    .select("*")
    .eq("id_transaction", idTransaction)
    .single();

  if (error) {
    return null;
  }
  return data as unknown as Record<string, unknown> | null;
}

async function updateTransactionStatus(
  idTransaction: string,
  status: string,
  paidAt?: string | null,
) {
  const db = getSupabaseAdmin();
  const patch: Database["public"]["Tables"]["lofypay_transactions"]["Update"] = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (paidAt) {
    patch.paid_at = paidAt;
  }

  const { error } = await db
    .from("lofypay_transactions")
    .update(patch)
    .eq("id_transaction", idTransaction);
  if (error) {
    console.error("Failed to update LofyPay transaction:", error.message);
    throw new Error("Failed to update transaction.");
  }
}

async function activateUserSubscription(userId: string, planId: string, paidAt: string | null) {
  const subscriptionPlan = getPlanById(planId);
  if (!subscriptionPlan) {
    throw new Error("Plano desconhecido para ativacao.");
  }

  const startedAt = paidAt ? new Date(paidAt) : new Date();
  const subscription = createSubscription(subscriptionPlan.id, startedAt);
  const db = getSupabaseAdmin();

  await db
    .from("user_subscriptions")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("status", "active");

  const { error } = await db.from("user_subscriptions").insert({
    user_id: userId,
    plan_id: planId,
    status: "active",
    started_at: subscription.startedAt,
    expires_at: subscription.expiresAt,
    renewed_at: subscription.startedAt,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Failed to activate subscription:", error.message);
    throw new Error("Failed to activate subscription.");
  }

  return subscription;
}

async function getActiveUserSubscription(userId: string) {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("user_subscriptions")
    .select("plan_id, started_at, expires_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    planId: String(data.plan_id),
    startedAt: String(data.started_at),
    expiresAt: String(data.expires_at),
  };
}

async function handleCreatePix(request: Request, origin: string) {
  if (request.method !== "POST") return methodNotAllowed();

  const body = await parseJsonBody(request);
  if (!body) return badRequest("Invalid JSON payload.");

  const method = body.method;
  const client = body.client as Record<string, unknown> | null;
  const planId = body.plan_id as string | undefined;
  const userId = body.user_id as string | undefined;

  if (method !== "pix") {
    return badRequest("Payment method must be 'pix'.");
  }

  if (!client || typeof client.name !== "string" || !client.name.trim()) {
    return badRequest("client.name is required.");
  }

  if (!isValidDocument(client.document)) {
    return badRequest("client.document must contain only digits and be a valid CPF or CNPJ.");
  }

  if (!client.email || typeof client.email !== "string" || !client.email.includes("@")) {
    return badRequest("client.email is required.");
  }

  const plan = getPlanById(planId);
  if (!plan) {
    return badRequest("plan_id is required and must be valid.");
  }

  const user = await getRequestUser(request);
  if (!user || !user.id) {
    return unauthorized("Invalid or missing Supabase access token.");
  }

  if (userId && user.id !== userId) {
    return forbidden("User mismatch.");
  }

  const amount = plan.priceValue;
  const externalReference = `${user.id}-${plan.id}-${crypto.randomUUID()}`;
  const notificationUrl = getNotificationUrl(origin);
  const lofyBody = {
    amount,
    method: "pix",
    external_reference: externalReference,
    client: {
      name: client.name,
      document: String(client.document).replace(/\D/g, ""),
      email: client.email,
    },
    metadata: {
      order_id: externalReference,
      plan_id: plan.id,
      user_id: user.id,
    },
  };

  if (notificationUrl) {
    Object.assign(lofyBody, { notification_url: notificationUrl });
  }

  const { response, payload, rawText } = await callLofyPay("/gateway", { body: lofyBody });
  const statusCode = response.status;

  if (statusCode >= 300 && statusCode < 400) {
    console.error("LofyPay gateway redirected instead of returning PIX data:", {
      status: statusCode,
      location: response.headers.get("location"),
      payload,
    });
    return serverError(
      "LofyPay redirected to a login page. Configure the public PIX API endpoint.",
    );
  }

  if (!response.ok) {
    if (statusCode === 401) return unauthorized("LofyPay rejected the API key.");
    if (statusCode === 403) return forbidden("LofyPay forbidden.");
    if (statusCode === 404) return notFound("LofyPay endpoint not found.");
    if (statusCode === 429) {
      return jsonResponse({ status: "error", message: "Rate limit exceeded." }, 429, {
        "Retry-After": response.headers.get("Retry-After") ?? "",
      });
    }
    console.error("LofyPay create payment failed:", {
      status: statusCode,
      payload,
    });
    return serverError("LofyPay gateway error.");
  }

  const paymentPayload = normalizeLofyPayPayload(payload);

  if (!paymentPayload) {
    console.error("LofyPay create payment returned an unexpected payload:", {
      payloadType: Array.isArray(payload) ? "array" : typeof payload,
      rawPreview: rawText.slice(0, 500),
    });
    if (/^\s*<!doctype html|^\s*<html/i.test(rawText)) {
      return serverError(
        "LofyPay returned HTML instead of JSON. Check LOFYPAY_BASE_URL and API key.",
      );
    }
    return serverError("Invalid response from LofyPay.");
  }

  const paymentCode = extractPixCode(paymentPayload);
  const idTransaction = extractIdTransaction(paymentPayload);
  const paymentCodeBase64 = extractPixImage(paymentPayload);
  const statusPayment = normalizePaymentStatus(getString(paymentPayload.status));

  if (!paymentCode || !idTransaction) {
    console.error("LofyPay response is missing payment details:", {
      keys: Object.keys(paymentPayload),
      rawPreview: rawText.slice(0, 500),
      hasPaymentCode: Boolean(paymentCode),
      hasIdTransaction: Boolean(idTransaction),
    });
    return serverError("LofyPay response is missing payment details.");
  }

  try {
    await saveTransaction({
      user_id: user.id,
      external_reference: externalReference,
      plan_id: plan.id,
      amount,
      status: "WAITING",
      id_transaction: idTransaction,
      payment_code: paymentCode,
      payment_code_base64: paymentCodeBase64,
      notification_url: notificationUrl || "polling-only",
    });
  } catch (error) {
    return serverError("Failed to save transaction in the database.");
  }

  return jsonResponse({
    status: "success",
    paymentCode,
    idTransaction,
    paymentCodeBase64,
    externalReference,
    statusPayment,
  });
}

async function handleStatus(request: Request) {
  if (request.method !== "POST") return methodNotAllowed();

  const body = await parseJsonBody(request);
  if (!body) return badRequest("Invalid JSON payload.");
  const idtransaction = getIdTransactionField(body);
  if (!idtransaction) {
    return badRequest("idtransaction is required.");
  }

  const user = await getRequestUser(request);
  if (!user || !user.id) {
    return unauthorized("Invalid or missing Supabase access token.");
  }

  const transaction = await getTransactionById(idtransaction);
  if (!transaction) {
    return notFound("Transaction not found.");
  }

  if (String(transaction.user_id) !== user.id) {
    return forbidden("Transaction does not belong to this user.");
  }

  const { response, payload } = await callLofyPay("/status", {
    method: "POST",
    body: { idtransaction },
  });
  const statusCode = response.status;
  if (!response.ok) {
    if (statusCode === 401) return unauthorized("LofyPay rejected the API key.");
    if (statusCode === 403) return forbidden("LofyPay forbidden.");
    if (statusCode === 404) return notFound("Transaction not found.");
    if (statusCode === 429) {
      return jsonResponse({ status: "error", message: "Rate limit exceeded." }, 429, {
        "Retry-After": response.headers.get("Retry-After") ?? "",
      });
    }
    return serverError("LofyPay gateway error.");
  }

  if (!isRecord(payload) || typeof payload.status !== "string") {
    return serverError("Invalid response from LofyPay.");
  }

  const status = normalizePaymentStatus(payload.status);
  const paidAt =
    status === "PAID"
      ? getString(payload.paid_at) || getString(transaction.paid_at) || new Date().toISOString()
      : null;
  await updateTransactionStatus(idtransaction, status, paidAt);

  let subscription = null;
  if (
    status === "PAID" &&
    transaction.status !== "PAID" &&
    transaction.user_id &&
    transaction.plan_id
  ) {
    const activatedSubscription = await activateUserSubscription(
      String(transaction.user_id),
      String(transaction.plan_id),
      paidAt,
    );
    subscription = {
      planId: activatedSubscription.planId,
      startedAt: activatedSubscription.startedAt,
      expiresAt: activatedSubscription.expiresAt,
    };
  } else if (status === "PAID" && transaction.user_id) {
    subscription = await getActiveUserSubscription(String(transaction.user_id));
  }

  return jsonResponse({
    status,
    planId: transaction.plan_id,
    subscription,
    activated: status === "PAID",
  });
}

async function handleWebhook(request: Request) {
  if (request.method !== "POST") return methodNotAllowed();

  const rawBody = await request.text();
  const signatureHeader = request.headers.get("x-lofypay-signature");
  if (!verifyLofyPaySignature(rawBody, signatureHeader)) {
    return unauthorized("Invalid webhook signature.");
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return badRequest("Invalid webhook payload.");
  }

  const data = getNestedRecord(payload, "data");
  const transactionPayload = data ? getNestedRecord(data, "transaction") : null;
  const event = getString(payload.event);
  const status = normalizePaymentStatus(
    getString(payload.status) || getString(data?.status) || event,
  );
  const idTransaction =
    getString(payload.id) ||
    getString(payload.payment_id) ||
    getString(payload.idTransaction) ||
    getString(transactionPayload?.id) ||
    getString(transactionPayload?.idTransaction);
  const externalReference =
    getString(payload.external_reference) || getString(transactionPayload?.external_reference);
  const paidAt = getString(payload.paid_at) || getString(data?.paid_at) || new Date().toISOString();

  if (!idTransaction || !status) {
    return badRequest("Webhook payload must include idTransaction and status.");
  }

  const transaction = await getTransactionById(idTransaction);
  if (transaction) {
    await updateTransactionStatus(idTransaction, status, status === "PAID" ? paidAt : null);
  } else {
    console.warn("Received LofyPay webhook for unknown transaction:", {
      idTransaction,
      externalReference,
    });
    return jsonResponse({ status: "success" });
  }

  if (
    status === "PAID" &&
    transaction.status !== "PAID" &&
    transaction.user_id &&
    transaction.plan_id
  ) {
    await activateUserSubscription(
      String(transaction.user_id),
      String(transaction.plan_id),
      paidAt,
    );
  }

  return jsonResponse({ status: "success" });
}

export async function handleLofyPayRequest(request: Request) {
  const url = new URL(request.url);

  if (url.pathname === "/api/lofypay/create-pix") {
    return handleCreatePix(request, url.origin);
  }

  if (url.pathname === "/api/lofypay/status") {
    return handleStatus(request);
  }

  if (url.pathname === "/api/webhook/lofypay") {
    return handleWebhook(request);
  }

  return notFound("LofyPay endpoint not found.");
}

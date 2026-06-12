import { createServerFn } from "@tanstack/react-start";

type LofyPayClient = {
  name: string;
  document: string;
  email: string;
};

export type CreateLofyPayPixInput = {
  origin: string;
  accessToken: string;
  method: "pix";
  plan_id: string;
  user_id: string;
  client: LofyPayClient;
};

export type LofyPayPixPayload = {
  status: "success";
  paymentCode: string;
  idTransaction: string;
  paymentCodeBase64: string;
  externalReference: string;
  statusPayment: string;
};

export type LofyPayStatusPayload = {
  status: string;
  planId?: string;
  activated?: boolean;
  subscription?: {
    planId: string;
    startedAt: string;
    expiresAt: string;
  } | null;
};

export type LofyPayActionResult<T> =
  | { ok: true; status: number; payload: T }
  | { ok: false; status: number; message: string };

export type GetLofyPayStatusInput = {
  origin: string;
  accessToken: string;
  idtransaction: string;
};

function getStringField(value: unknown, field: string) {
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  return typeof record[field] === "string" ? record[field] : "";
}

async function callInternalLofyPay<T>(
  pathname: string,
  origin: string,
  accessToken: string,
  body: unknown,
): Promise<LofyPayActionResult<T>> {
  const { handleLofyPayRequest } = await import("@/server/lofypay");
  const response = await handleLofyPayRequest(
    new Request(`${origin}${pathname}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    }),
  );
  const payload = (await response.json().catch(() => null)) as T | Record<string, unknown> | null;

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      message: getStringField(payload, "message") || "Falha na comunicacao com o pagamento.",
    };
  }

  return { ok: true, status: response.status, payload: payload as T };
}

export const createLofyPayPix = createServerFn({ method: "POST" })
  .inputValidator((input: CreateLofyPayPixInput) => input)
  .handler(async ({ data }) => {
    return callInternalLofyPay<LofyPayPixPayload>(
      "/api/lofypay/create-pix",
      data.origin,
      data.accessToken,
      {
        method: data.method,
        plan_id: data.plan_id,
        user_id: data.user_id,
        client: data.client,
      },
    );
  });

export const getLofyPayStatus = createServerFn({ method: "POST" })
  .inputValidator((input: GetLofyPayStatusInput) => input)
  .handler(async ({ data }) => {
    return callInternalLofyPay<LofyPayStatusPayload>(
      "/api/lofypay/status",
      data.origin,
      data.accessToken,
      { idtransaction: data.idtransaction },
    );
  });

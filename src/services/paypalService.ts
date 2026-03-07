/**
 * PayPal service — thin fetch wrapper that talks to your backend API.
 *
 * Backend contracts (implement these on your server):
 *
 * POST /api/paypal/create-order
 *   Request body : CreateOrderRequest
 *   Response     : { orderId: string }
 *
 * POST /api/paypal/capture-order
 *   Request body : { orderId: string }
 *   Response     : CaptureOrderResponse
 */

import { paypalConfig } from "@/config/paypal";
import type { CartItem } from "@/contexts/CartContext";

// ---------------------------------------------------------------------------
// Request / response types
// ---------------------------------------------------------------------------

export interface CreateOrderRequest {
  userId: string;
  currency: string;
  total: number;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}

export interface CreateOrderResponse {
  orderId: string;
}

export interface CaptureOrderResponse {
  status: "COMPLETED" | "PENDING" | string;
  payerEmail: string;
  transactionId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_TIMEOUT_MS = 15_000;

async function request<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal
): Promise<T> {
  const url = `${paypalConfig.apiBaseUrl}${path}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const json = await response.json();
      message = json?.message ?? json?.error ?? message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calls POST /api/paypal/create-order and returns the PayPal order ID.
 * The returned `orderId` should be passed directly to the PayPal JS SDK.
 */
export async function createOrder(params: {
  userId: string;
  items: CartItem[];
  total: number;
}): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const body: CreateOrderRequest = {
      userId: params.userId,
      currency: paypalConfig.currency,
      total: params.total,
      items: params.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    };

    const data = await request<CreateOrderResponse>(
      "/api/paypal/create-order",
      body,
      controller.signal
    );

    return data.orderId;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Calls POST /api/paypal/capture-order and returns the capture result.
 * Call this inside the PayPal SDK's `onApprove` callback.
 */
export async function captureOrder(orderId: string): Promise<CaptureOrderResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    return await request<CaptureOrderResponse>(
      "/api/paypal/capture-order",
      { orderId },
      controller.signal
    );
  } finally {
    clearTimeout(timer);
  }
}

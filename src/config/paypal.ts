/**
 * PayPal configuration — reads from Vite environment variables.
 *
 * Required env vars (set in .env):
 *   VITE_PAYPAL_CLIENT_ID  — your PayPal app's sandbox or live client ID
 *
 * Optional:
 *   VITE_PAYPAL_CURRENCY   — defaults to "USD"
 *   VITE_PAYPAL_INTENT     — defaults to "capture"
 *   VITE_API_BASE_URL      — base URL of the backend API (default: http://localhost:4000)
 */

const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined;

if (!clientId || clientId === "YOUR_PAYPAL_SANDBOX_CLIENT_ID") {
  // Warn loudly in development so the missing config is obvious
  if (import.meta.env.DEV) {
    console.warn(
      "[PayPal] VITE_PAYPAL_CLIENT_ID is not set. " +
      "PayPal buttons will be disabled until you add a valid client ID to .env."
    );
  }
}

export const paypalConfig = {
  /** PayPal JS SDK client ID */
  clientId: clientId ?? "",
  /** Payment currency (e.g. "USD") */
  currency: (import.meta.env.VITE_PAYPAL_CURRENCY as string | undefined) ?? "USD",
  /** Payment intent — "capture" completes immediately; "authorize" reserves funds */
  intent: (import.meta.env.VITE_PAYPAL_INTENT as string | undefined) ?? "capture",
  /** Base URL of your backend API */
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:4000",
  /** True when a real client ID has been provided */
  isConfigured: !!clientId && clientId !== "YOUR_PAYPAL_SANDBOX_CLIENT_ID",
} as const;

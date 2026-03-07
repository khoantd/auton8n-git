import { useState, useRef, useEffect } from "react";
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { paypalConfig } from "@/config/paypal";
import { createOrder, captureOrder } from "@/services/paypalService";
import type { CartItem } from "@/contexts/CartContext";
import { AlertCircle, Loader2 } from "lucide-react";

const POPUP_CHECK_MS = 2000;

interface PayPalCheckoutProps {
  amount: number;
  items: CartItem[];
  onSuccess: () => Promise<void> | void;
  disabled?: boolean;
}

export function PayPalCheckout({ amount, items, onSuccess, disabled }: PayPalCheckoutProps) {
  const [{ isPending }] = usePayPalScriptReducer();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isCapturing, setIsCapturing] = useState(false);
  const popupCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (popupCheckTimerRef.current) clearTimeout(popupCheckTimerRef.current);
    };
  }, []);

  // Show a clear message when no client ID is configured
  if (!paypalConfig.isConfigured) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-700 dark:text-yellow-400">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          PayPal is not configured. Add{" "}
          <code className="rounded bg-yellow-500/20 px-1 font-mono">VITE_PAYPAL_CLIENT_ID</code>{" "}
          to your <code className="rounded bg-yellow-500/20 px-1 font-mono">.env</code> file.
        </span>
      </div>
    );
  }

  const clearPopupCheckTimer = () => {
    if (popupCheckTimerRef.current) {
      clearTimeout(popupCheckTimerRef.current);
      popupCheckTimerRef.current = null;
    }
  };

  const handleCreateOrder = async (): Promise<string> => {
    if (!user) throw new Error("You must be signed in to pay with PayPal.");
    clearPopupCheckTimer();

    try {
      const orderId = await createOrder({ userId: user.id, items, total: amount });
      popupCheckTimerRef.current = window.setTimeout(() => {
        popupCheckTimerRef.current = null;
        toast({
          title: "Popup may be blocked",
          description: "A window was expected to open for PayPal. Please allow popups for this site and try again.",
          variant: "destructive",
        });
      }, POPUP_CHECK_MS);
      return orderId;
    } catch (err: any) {
      toast({
        title: "Could not start PayPal checkout",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleApprove = async (data: { orderID: string }) => {
    clearPopupCheckTimer();
    setIsCapturing(true);
    try {
      await captureOrder(data.orderID);
      await onSuccess();
    } catch (err: any) {
      toast({
        title: "Payment capture failed",
        description: err?.message ?? "Your payment could not be captured. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleError = (err: Record<string, unknown>) => {
    console.error("[PayPal] error", err);
    toast({
      title: "PayPal error",
      description: "Something went wrong with PayPal. Please try again.",
      variant: "destructive",
    });
  };

  const handleCancel = () => {
    clearPopupCheckTimer();
    toast({
      title: "Payment cancelled",
      description: "You cancelled the PayPal payment. Your cart is intact.",
    });
  };

  const isLoading = isPending || isCapturing;

  return (
    <div className="space-y-3">
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {isCapturing ? "Capturing payment…" : "Loading PayPal…"}
        </div>
      )}
      <div className={isLoading || disabled ? "pointer-events-none opacity-50" : undefined}>
        <PayPalButtons
          style={{ layout: "vertical", shape: "rect", color: "gold", label: "pay" }}
          disabled={disabled}
          createOrder={handleCreateOrder}
          onApprove={handleApprove}
          onError={handleError}
          onCancel={handleCancel}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        If the PayPal window doesn’t open or shows errors, try a private/incognito window or temporarily disable ad blockers for this site.
      </p>
    </div>
  );
}

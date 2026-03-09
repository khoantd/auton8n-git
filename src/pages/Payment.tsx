import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, QrCode, DollarSign, Upload, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { Navigate, useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PayPalCheckout } from "@/components/payments/PayPalCheckout";
import type { CartItem } from "@/contexts/CartContext";
import { fetchSubscriptionsEnabled } from "@/utils/systemSettings";
import { apiUrl } from "@/lib/api";

// ---------------------------------------------------------------------------
// Payment method helpers (mirrors logic in PaymentMethodsManager)
// ---------------------------------------------------------------------------

interface QRConfig {
  qr_image_url?: string;
  recipient_name?: string;
  account_details?: string;
  instructions?: string;
}

const toTabKey = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes("paypal")) return "paypal";
  if (lower.includes("stripe")) return "stripe";
  if (lower.includes("qr")) return "qr";
  return lower.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
};

const toConfigKey = (name: string) =>
  `payment_config_${name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")}`;

const formatVnd = (amount: number): string =>
  Math.round(amount).toLocaleString("vi-VN");

const Payment = () => {
  const { toast } = useToast();
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const { refreshSubscription, addPurchasedWorkflowIds } = useSubscription();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("");
  const [qrForm, setQrForm] = useState({ transactionId: "", senderName: "", amount: "" });
  const [subscriptionsEnabled, setSubscriptionsEnabled] = useState<boolean | null>(null);
  // null = not loaded yet (show all tabs as fallback); Set = loaded list of enabled keys
  const [enabledTabKeys, setEnabledTabKeys] = useState<Set<string> | null>(null);
  const [qrConfig, setQrConfig] = useState<QRConfig>({});
  const [priceAdjustedItems, setPriceAdjustedItems] = useState<CartItem[] | null>(null);
  // workflowId → price_vnd (null means not set)
  const [workflowVndMap, setWorkflowVndMap] = useState<Map<string, number | null>>(new Map());

  useEffect(() => {
    let isMounted = true;

    const loadAll = async () => {
      // 1. Load subscriptions toggle
      const enabled = await fetchSubscriptionsEnabled();

      // 2. Load enabled payment methods
      const { data: methodsData } = await supabase
        .from("payment_types")
        .select("name, is_enabled")
        .eq("is_enabled", true);

      const keys = new Set<string>(
        (methodsData || []).map((m: { name: string }) => toTabKey(m.name))
      );

      // 3. Load QR config if QR method is enabled
      const qrMethodName = (methodsData || []).find((m: { name: string }) =>
        m.name.toLowerCase().includes("qr")
      )?.name;

      if (qrMethodName) {
        const { data: configData } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", toConfigKey(qrMethodName))
          .maybeSingle();
        if (configData?.value && typeof configData.value === "object") {
          if (isMounted) setQrConfig(configData.value as QRConfig);
        }
      }

      if (!isMounted) return;
      setSubscriptionsEnabled(enabled);
      // Only override if we actually got data back; otherwise show all tabs
      if (keys.size > 0) {
        setEnabledTabKeys(keys);
        // Set default active tab once we know which tabs are enabled
        const TAB_ORDER = ["stripe", "paypal", "qr"] as const;
        const firstEnabled = TAB_ORDER.find((k) => keys.has(k)) ?? "stripe";
        setActiveTab((prev) => prev || firstEnabled);
      } else {
        setActiveTab((prev) => prev || "stripe");
      }
    };

    loadAll().catch((error) => {
      console.error("Error loading payment page settings:", error);
      if (!isMounted) return;
      setSubscriptionsEnabled(true);
      setActiveTab((prev) => prev || "stripe");
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Keep workflow item prices (USD + VND) in sync with the latest values from Supabase
  useEffect(() => {
    let isMounted = true;

    const syncWorkflowPrices = async () => {
      if (!items.length) {
        if (isMounted) {
          setPriceAdjustedItems(null);
          setWorkflowVndMap(new Map());
        }
        return;
      }

      const workflowCartItems = items.filter((item) => item.id.startsWith("wf-"));
      if (workflowCartItems.length === 0) {
        if (isMounted) {
          setPriceAdjustedItems(items);
          setWorkflowVndMap(new Map());
        }
        return;
      }

      const workflowIds = workflowCartItems.map((item) => item.id.replace("wf-", ""));
      const { data, error } = await supabase
        .from("workflows")
        .select("id, price, price_vnd")
        .in("id", workflowIds);

      if (!isMounted) return;

      if (error || !data) {
        console.error("Failed to refresh workflow prices for checkout:", error);
        setPriceAdjustedItems(items);
        return;
      }

      const priceById = new Map<string, number | null>(
        data.map((w: { id: string; price: number | null }) => [w.id, w.price])
      );
      const vndById = new Map<string, number | null>(
        data.map((w: { id: string; price_vnd: number | null }) => [w.id, w.price_vnd])
      );

      const updated = items.map((item) => {
        if (!item.id.startsWith("wf-")) return item;
        const workflowId = item.id.replace("wf-", "");
        const latestPrice = priceById.get(workflowId);
        if (latestPrice == null) return item;
        if (latestPrice === item.price) return item;
        return { ...item, price: latestPrice };
      });

      setPriceAdjustedItems(updated);
      setWorkflowVndMap(vndById);
    };

    syncWorkflowPrices().catch((err) => {
      console.error("Unexpected error while syncing workflow prices:", err);
      if (isMounted) {
        setPriceAdjustedItems(items);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [items]);

  if (subscriptionsEnabled === null) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="relative pt-28 pb-16">
          <div className="absolute inset-0 hero-gradient" />
          <div className="container relative mx-auto px-4 max-w-4xl">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Checkout</h1>
              <p className="text-muted-foreground">Preparing your payment session...</p>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const sourceItems = priceAdjustedItems ?? items;
  const subscriptionPlanIds = new Set(["pro", "enterprise"]);
  const hasSubscriptionItems = sourceItems.some((item) => subscriptionPlanIds.has(item.id));
  const effectiveItems: CartItem[] = subscriptionsEnabled
    ? sourceItems
    : sourceItems.filter((item) => !subscriptionPlanIds.has(item.id));
  const effectiveTotal = effectiveItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // VND mode: active only on QR tab when every workflow item in the cart has a price_vnd
  const workflowItems = effectiveItems.filter((item) => item.id.startsWith("wf-"));
  const allWorkflowsHaveVnd =
    workflowItems.length > 0 &&
    workflowItems.every((item) => {
      const wfId = item.id.replace("wf-", "");
      const vnd = workflowVndMap.get(wfId);
      return vnd != null && vnd > 0;
    });
  // Subscriptions in cart prevent full-VND mode (spec: show USD for the whole order)
  const isVndMode = activeTab === "qr" && allWorkflowsHaveVnd && !hasSubscriptionItems;

  const effectiveTotalVnd = isVndMode
    ? workflowItems.reduce((sum, item) => {
        const wfId = item.id.replace("wf-", "");
        return sum + (workflowVndMap.get(wfId) ?? 0) * item.quantity;
      }, 0)
    : 0;

  const qrImageSrc = qrConfig.qr_image_url || "/qr-payment-acb.png";

  if (effectiveItems.length === 0) {
    return <Navigate to="/pricing" replace />;
  }

  // Derived tab visibility — fall back to all tabs when methods haven't loaded yet
  const TAB_ORDER = ["stripe", "paypal", "qr"] as const;
  const isTabEnabled = (key: string) => enabledTabKeys === null || enabledTabKeys.has(key);
  const enabledTabs = TAB_ORDER.filter(isTabEnabled);
  const firstEnabledTab = enabledTabs[0] ?? "stripe";
  const resolvedActiveTab = activeTab || firstEnabledTab;
  const gridColsClass = enabledTabs.length === 1 ? "grid-cols-1" : enabledTabs.length === 2 ? "grid-cols-2" : "grid-cols-3";

  const handlePaymentSuccess = async (
    method: string,
    chargeItems: CartItem[],
    chargeTotal: number,
    options?: {
      currency?: string;
      qrMetadata?: {
        senderName: string;
        transactionId: string;
        amount: number;
      };
    }
  ) => {
    if (!user) {
      toast({
        title: "Auth required",
        description: "You must be signed in to complete a purchase.",
        variant: "destructive"
      });
      return;
    }

    const currency = options?.currency ?? "USD";

    try {
      // 1. Record the transaction
      const { error: transError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          amount: chargeTotal,
          currency,
          status: "completed",
          payment_method: method,
          items: chargeItems
        })
        .select()
        .single();

      if (transError) throw transError;

      // 2. Identify and save purchased workflows/subscriptions
      const workflowIds = chargeItems
        .filter(item => item.id.startsWith("wf-"))
        .map(item => item.id.replace("wf-", ""));

      if (workflowIds.length > 0) {
        const { error: wfError } = await supabase
          .from("purchased_workflows")
          .insert(workflowIds.map(wfId => ({
            user_id: user.id,
            workflow_id: wfId
          })));

        if (wfError) {
          console.error("Error saving purchased workflows:", wfError);
          // Don't throw here, as transaction succeeded
        }

        // Optimistic update so the home page shows "Download" immediately after navigate
        addPurchasedWorkflowIds(workflowIds);
      }

      // Check for plan upgrades
      const proPlan = chargeItems.find(item => item.id === "pro");
      const enterprisePlan = chargeItems.find(item => item.id === "enterprise");

      if (proPlan || enterprisePlan) {
        const planType = proPlan ? "pro" : "enterprise";
        const { error: subError } = await supabase
          .from("subscriptions")
          .insert({
            user_id: user.id,
            plan_type: planType,
            status: "active",
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
          });

        if (subError) {
          console.error("Error saving subscription:", subError);
        }
      }

      // Refresh subscription status
      await refreshSubscription();

      // Fire-and-forget notification email to sales
      try {
        const url = apiUrl("/api/payment/notify");

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            userEmail: user.email,
            paymentMethod: method,
            amount: chargeTotal,
            currency,
            items: chargeItems.map((item) => ({
              id: item.id,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })),
            qrMetadata: options?.qrMetadata,
          }),
        });

        if (!response.ok) {
          console.error(
            "Failed to send payment notification email:",
            await response.text()
          );
        }
      } catch (notifyError) {
        console.error("Error while sending payment notification email:", notifyError);
      }

      toast({
        title: "Payment Successful",
        description: `Your payment via ${method} was successful. Thank you for your purchase!`,
      });
      clearCart();
      navigate("/"); // Redirect to home/dashboard after payment
    } catch (error: any) {
      console.error("Payment persistence error:", error);
      toast({
        title: "Error recording payment",
        description: "Your payment was successful but we had trouble updating your account. Please contact support.",
        variant: "destructive"
      });
    }
  };


  const handleQrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrForm.transactionId.trim() || !qrForm.senderName.trim() || !qrForm.amount.trim()) {
      toast({ title: "Missing fields", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }

    if (!user) {
      toast({ title: "Auth required", description: "You must be signed in to complete a purchase.", variant: "destructive" });
      return;
    }

    const currency = isVndMode ? "VND" : "USD";
    const chargeTotal = isVndMode ? effectiveTotalVnd : effectiveTotal;

    try {
      const { error: transError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          amount: chargeTotal,
          currency,
          status: "pending",
          payment_method: "QR Code",
          items: effectiveItems,
          metadata: {
            qr_transaction_id: qrForm.transactionId.trim(),
            sender_name: qrForm.senderName.trim(),
          },
        });

      if (transError) throw transError;

      toast({
        title: "Payment submitted",
        description: "Your order is pending approval. You will be notified once confirmed.",
      });
      clearCart();
      navigate("/");
    } catch (error: any) {
      console.error("QR payment submission error:", error);
      toast({
        title: "Submission failed",
        description: "Could not submit your payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="relative pt-28 pb-16">
        <div className="absolute inset-0 hero-gradient" />
        <div className="container relative mx-auto px-4 max-w-4xl">
          <div className="text-center mb-10 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Checkout</h1>
            <p className="text-muted-foreground">Complete your purchase securely</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Order Summary */}
            <div className="md:col-span-1 animate-slide-up order-2 md:order-1">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isVndMode ? (
                    <>
                      {effectiveItems.map((item) => {
                        const wfId = item.id.replace("wf-", "");
                        const vnd = workflowVndMap.get(wfId) ?? 0;
                        return (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {item.name} {item.quantity > 1 && `x${item.quantity}`}
                            </span>
                            <span>{formatVnd(vnd * item.quantity)} VND</span>
                          </div>
                        );
                      })}
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>{formatVnd(effectiveTotalVnd)} VND</span>
                      </div>
                    </>
                  ) : (
                    <>
                      {effectiveItems.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {item.name} {item.quantity > 1 && `x${item.quantity}`}
                          </span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>${effectiveTotal.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter>
                  <div className="text-xs text-muted-foreground flex gap-2">
                    <Info className="h-4 w-4" />
                    Payments are secure and encrypted.
                  </div>
                </CardFooter>
              </Card>
            </div>

            {/* Payment Methods */}
            <div className="md:col-span-2 animate-slide-up order-1 md:order-2">
              <Tabs value={resolvedActiveTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className={`grid w-full ${gridColsClass} bg-secondary/60 border border-border mb-6`}>
                  {isTabEnabled("stripe") && (
                    <TabsTrigger value="stripe" className="gap-2 data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                      <CreditCard className="h-4 w-4" /> Stripe
                    </TabsTrigger>
                  )}
                  {isTabEnabled("paypal") && (
                    <TabsTrigger value="paypal" className="gap-2 data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                      <DollarSign className="h-4 w-4" /> PayPal
                    </TabsTrigger>
                  )}
                  {isTabEnabled("qr") && (
                    <TabsTrigger value="qr" className="gap-2 data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                      <QrCode className="h-4 w-4" /> QR Code
                    </TabsTrigger>
                  )}
                </TabsList>

                {/* Stripe Tab */}
                {isTabEnabled("stripe") && (
                  <TabsContent value="stripe">
                    <Card className="border-border bg-card/80 backdrop-blur">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-foreground">
                          <CreditCard className="h-5 w-5 text-primary" /> Pay via Stripe
                        </CardTitle>
                        <CardDescription>Enter your card details securely.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="rounded-lg border border-border bg-secondary/30 p-6 text-center space-y-4">
                          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <CreditCard className="h-8 w-8 text-primary" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            This is a secure 128-bit SSL encrypted payment.
                          </p>
                          <div className="flex justify-center gap-3">
                            {["Visa", "Mastercard", "Amex"].map((brand) => (
                              <span key={brand} className="px-3 py-1 rounded-md bg-secondary/50 border border-border text-xs text-muted-foreground">
                                {brand}
                              </span>
                            ))}
                          </div>
                        </div>
                        <Button
                          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                          size="lg"
                          onClick={() => handlePaymentSuccess("Stripe", effectiveItems, effectiveTotal, { currency: "USD" })}
                        >
                          Pay ${effectiveTotal.toFixed(2)}
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                {/* PayPal Tab */}
                {isTabEnabled("paypal") && (
                  <TabsContent value="paypal">
                    <Card className="border-border bg-card/80 backdrop-blur">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-foreground">
                          <DollarSign className="h-5 w-5 text-primary" /> PayPal
                        </CardTitle>
                        <CardDescription>Safe payment via PayPal.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="rounded-lg border border-border bg-secondary/30 p-6 text-center space-y-4">
                          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <DollarSign className="h-8 w-8 text-primary" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            A window will open for you to log in to PayPal and complete your purchase securely.
                          </p>
                          <p className="text-xs text-muted-foreground/80">
                            If the PayPal window doesn&apos;t open, allow popups for this site or try another browser. Safari and some content blockers can prevent the window from loading.
                          </p>
                        </div>
                        <PayPalCheckout
                          amount={effectiveTotal}
                          items={effectiveItems}
                          onSuccess={() => handlePaymentSuccess("PayPal", effectiveItems, effectiveTotal, { currency: "USD" })}
                          disabled={!user}
                        />
                        {!user && (
                          <p className="text-center text-sm text-muted-foreground space-y-1">
                            Please <a href="/auth" className="underline text-primary">sign in</a> to pay with PayPal.
                            <span className="block">You must be signed in here first; then you&apos;ll complete payment in a separate PayPal window.</span>
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                {/* QR Code Tab */}
                {isTabEnabled("qr") && (
                  <TabsContent value="qr">
                    <Card className="border-border bg-card/80 backdrop-blur">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-foreground">
                          <QrCode className="h-5 w-5 text-primary" /> QR Payment
                        </CardTitle>
                        <CardDescription>
                          {qrConfig.recipient_name
                            ? `Send payment to ${qrConfig.recipient_name}`
                            : "Scan and upload proof of payment."}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* QR image — use configured URL or fallback placeholder */}
                        <div className="rounded-lg border border-dashed border-border bg-secondary/20 p-8 flex flex-col items-center gap-3">
                          {qrImageSrc ? (
                            <img
                              src={qrImageSrc}
                              alt="Payment QR Code"
                              className="w-full max-w-[450px] aspect-square rounded-lg object-contain"
                              onError={(e) => {
                                (e.currentTarget.style.display = "none");
                              }}
                            />
                          ) : (
                            <div className="w-40 h-40 rounded-lg bg-foreground/5 border border-border flex items-center justify-center">
                              <QrCode className="h-20 w-20 text-muted-foreground/40" />
                            </div>
                          )}
                          {qrConfig.account_details && (
                            <p className="text-xl font-mono text-muted-foreground text-center">
                              {qrConfig.account_details}
                            </p>
                          )}
                          {qrConfig.instructions ? (
                            <p className="text-xl text-muted-foreground text-center max-w-xs">
                              {qrConfig.instructions}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground text-center">Scan to pay</p>
                          )}
                        </div>

                        <form onSubmit={handleQrSubmit} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="senderName" className="text-foreground">Sender Name</Label>
                              <Input
                                id="senderName"
                                placeholder="Your full name"
                                value={qrForm.senderName}
                                onChange={(e) => setQrForm(prev => ({ ...prev, senderName: e.target.value }))}
                                className="bg-secondary/40 border-border"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="amount" className="text-foreground">
                                {isVndMode ? "Amount (VND)" : "Amount"}
                              </Label>
                              <Input
                                id="amount"
                                type="number"
                                placeholder={
                                  isVndMode
                                    ? formatVnd(effectiveTotalVnd)
                                    : effectiveTotal.toFixed(2)
                                }
                                value={qrForm.amount}
                                onChange={(e) => setQrForm(prev => ({ ...prev, amount: e.target.value }))}
                                className="bg-secondary/40 border-border"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="transactionId" className="text-foreground">Transaction ID</Label>
                            <Input
                              id="transactionId"
                              placeholder="e.g. TXN-123456789"
                              value={qrForm.transactionId}
                              onChange={(e) => setQrForm(prev => ({ ...prev, transactionId: e.target.value }))}
                              className="bg-secondary/40 border-border"
                            />
                          </div>
                          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
                            <Upload className="h-4 w-4 mr-2" /> Confirm Payment
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
              </Tabs>
              {hasSubscriptionItems && !subscriptionsEnabled && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Subscription plans in your cart are currently disabled and will not be charged in this checkout.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Payment;

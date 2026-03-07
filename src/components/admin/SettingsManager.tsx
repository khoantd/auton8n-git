import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client"; // uses schema "app" (subscription_plans, system_settings)
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Rocket, Zap, Settings2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PaymentMethodsManager } from "./PaymentMethodsManager";

export const SettingsManager = () => {
    const { toast } = useToast();
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [subscriptionsEnabled, setSubscriptionsEnabled] = useState<boolean>(true);
    const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);
    const [planFormData, setPlanFormData] = useState({
        name: "",
        price: 0,
        features: [] as string[],
        is_popular: false
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const [plansRes, settingsRes] = await Promise.all([
                supabase.from("subscription_plans").select("*").order("price", { ascending: true }),
                supabase
                    .from("system_settings")
                    .select("value")
                    .eq("key", "subscriptions_enabled")
                    .maybeSingle(),
            ]);

            if (plansRes.error) throw plansRes.error;
            if (settingsRes.error) throw settingsRes.error;

            setPlans(plansRes.data || []);

            const rawValue = (settingsRes.data as { value: unknown } | null)?.value;
            if (typeof rawValue === "boolean") {
                setSubscriptionsEnabled(rawValue);
            } else if (typeof rawValue === "string") {
                const normalized = rawValue.toLowerCase();
                if (normalized === "true") setSubscriptionsEnabled(true);
                else if (normalized === "false") setSubscriptionsEnabled(false);
            } else if (rawValue && typeof rawValue === "object" && "enabled" in (rawValue as any)) {
                const enabled = (rawValue as any).enabled;
                if (typeof enabled === "boolean") {
                    setSubscriptionsEnabled(enabled);
                }
            }
        } catch (error: any) {
            toast({
                title: "Error fetching settings",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleSubscriptions = async () => {
        const nextValue = !subscriptionsEnabled;
        setSubscriptionsEnabled(nextValue);
        try {
            const { error } = await supabase
                .from("system_settings")
                .upsert({ key: "subscriptions_enabled", value: nextValue });

            if (error) throw error;

            toast({
                title: `Subscriptions ${nextValue ? "enabled" : "disabled"}`,
                description: nextValue
                    ? "Subscription plans are now visible and can be purchased."
                    : "Subscription plans are now hidden and cannot be purchased.",
            });
        } catch (error: any) {
            setSubscriptionsEnabled(!nextValue);
            toast({
                title: "Error updating subscription setting",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const handleOpenPlanDialog = (plan: any = null) => {
        if (plan) {
            setEditingPlan(plan);
            setPlanFormData({
                name: plan.name || "",
                price: plan.price || 0,
                features: plan.features || [],
                is_popular: plan.is_popular || false
            });
        } else {
            setEditingPlan(null);
            setPlanFormData({
                name: "",
                price: 0,
                features: [],
                is_popular: false
            });
        }
        setIsPlanDialogOpen(true);
    };

    const handleSavePlan = async () => {
        try {
            if (editingPlan) {
                const { error } = await supabase
                    .from("subscription_plans")
                    .update(planFormData)
                    .eq("id", editingPlan.id);
                if (error) throw error;
                toast({ title: "Plan updated successfully" });
            } else {
                const { error } = await supabase
                    .from("subscription_plans")
                    .insert([planFormData]);
                if (error) throw error;
                toast({ title: "Plan created successfully" });
            }
            setIsPlanDialogOpen(false);
            fetchSettings();
        } catch (error: any) {
            toast({
                title: "Error saving plan",
                description: error.message,
                variant: "destructive"
            });
        }
    };


    const addFeature = () => {
        setPlanFormData({ ...planFormData, features: [...planFormData.features, ""] });
    };

    const updateFeature = (idx: number, value: string) => {
        const newFeatures = [...planFormData.features];
        newFeatures[idx] = value;
        setPlanFormData({ ...planFormData, features: newFeatures });
    };

    const removeFeature = (idx: number) => {
        setPlanFormData({ ...planFormData, features: planFormData.features.filter((_, i) => i !== idx) });
    };

    return (
        <div className="grid gap-8 md:grid-cols-2">
            {/* Subscription Plans */}
            <div className="space-y-6">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-primary" />
                        <h3 className="text-xl font-bold">Subscription Plans</h3>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleOpenPlanDialog()}>
                        <Plus className="h-4 w-4 mr-1" /> Add Plan
                    </Button>
                </div>
                {loading ? (
                    <Card><CardContent className="p-8 text-center text-muted-foreground">Loading plans...</CardContent></Card>
                ) : plans.length === 0 ? (
                    <Card><CardContent className="p-8 text-center text-muted-foreground">No plans configured yet.</CardContent></Card>
                ) : (
                    plans.map((plan) => (
                        <Card key={plan.id} className="border-border/50 bg-card/50 overflow-hidden">
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                                        <CardDescription>Plan configuration and pricing.</CardDescription>
                                    </div>
                                    <Badge variant={plan.is_popular ? "default" : "outline"} className={plan.is_popular ? "bg-primary text-primary-foreground" : "border-border/50"}>
                                        ${plan.price}/mo
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Features</p>
                                    <ul className="grid grid-cols-1 gap-1">
                                        {plan.features?.map((feature: string, idx: number) => (
                                            <li key={idx} className="text-sm flex items-center gap-2 text-muted-foreground">
                                                <Zap className="h-3 w-3 text-primary/60" /> {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="flex justify-end mt-4 pt-4 border-t border-border/50">
                                    <Button variant="outline" size="sm" className="h-8" onClick={() => handleOpenPlanDialog(plan)}>Edit Plan</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Payment & Subscription Settings */}
            <div className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Settings2 className="h-5 w-5 text-primary" />
                        <h3 className="text-xl font-bold">Subscriptions</h3>
                    </div>
                    <Card className="border-border/50 bg-card/50">
                        <CardHeader>
                            <CardTitle className="text-lg">Subscription Availability</CardTitle>
                            <CardDescription>
                                Control whether subscription plans (e.g. Pro / Enterprise) are visible and purchasable.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-sm">Enable subscriptions</p>
                                    <p className="text-xs text-muted-foreground">
                                        When disabled, subscription plans are hidden from Pricing and checkout, but
                                        users can still purchase individual workflows.
                                    </p>
                                </div>
                                <Switch
                                    checked={subscriptionsEnabled}
                                    onCheckedChange={toggleSubscriptions}
                                    disabled={loading}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>

            {/* Full-width Payment Methods section */}
            <div className="mt-8 pt-8 border-t border-border/50">
                <PaymentMethodsManager />
            </div>

            <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
                <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-md border-border/50">
                    <DialogHeader>
                        <DialogTitle>{editingPlan ? "Edit Plan" : "Add New Plan"}</DialogTitle>
                        <DialogDescription>
                            Configure pricing and features for this subscription plan.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="planName" className="text-right">Name</Label>
                            <Input
                                id="planName"
                                className="col-span-3"
                                value={planFormData.name}
                                onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="planPrice" className="text-right">Price/mo ($)</Label>
                            <Input
                                id="planPrice"
                                type="number"
                                className="col-span-3"
                                value={planFormData.price}
                                onChange={(e) => setPlanFormData({ ...planFormData, price: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Popular?</Label>
                            <div className="col-span-3 flex items-center space-x-2">
                                <Switch
                                    checked={planFormData.is_popular}
                                    onCheckedChange={(checked) => setPlanFormData({ ...planFormData, is_popular: checked })}
                                />
                                <span className="text-sm text-muted-foreground">Highlight as popular choice</span>
                            </div>
                        </div>
                        <div className="space-y-4 pt-4 border-t border-border/50">
                            <div className="flex justify-between items-center">
                                <Label>Features</Label>
                                <Button type="button" variant="ghost" size="sm" onClick={addFeature}>
                                    <Plus className="h-3 w-3 mr-1" /> Add
                                </Button>
                            </div>
                            {planFormData.features.map((feature, idx) => (
                                <div key={idx} className="flex gap-2 items-center">
                                    <Input
                                        value={feature}
                                        onChange={(e) => updateFeature(idx, e.target.value)}
                                        placeholder="Feature description..."
                                    />
                                    <Button variant="ghost" size="icon" onClick={() => removeFeature(idx)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPlanDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSavePlan}>Save Plan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

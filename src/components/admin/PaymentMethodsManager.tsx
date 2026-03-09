import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
    CreditCard, Settings2, Plus, Trash2, ChevronDown, ChevronUp,
    Eye, EyeOff, Save, AlertCircle, QrCode, DollarSign,
} from "lucide-react";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { apiUrl } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PaymentMethod {
    id: string;
    name: string;
    description: string | null;
    is_enabled: boolean;
}

type MethodType = "paypal" | "stripe" | "qr" | "custom";

interface PayPalConfig {
    client_id: string;
    client_secret: string;
    environment: "sandbox" | "live";
    webhook_id: string;
}

interface StripeConfig {
    publishable_key: string;
    secret_key: string;
    webhook_secret: string;
}

interface QRConfig {
    qr_image_url: string;
    recipient_name: string;
    account_details: string;
    instructions: string;
}

type GatewayConfig = PayPalConfig | StripeConfig | QRConfig | Record<string, string>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getMethodType = (name: string): MethodType => {
    const lower = name.toLowerCase();
    if (lower.includes("paypal")) return "paypal";
    if (lower.includes("stripe")) return "stripe";
    if (lower.includes("qr")) return "qr";
    return "custom";
};

export const getPaymentConfigKey = (name: string) =>
    `payment_config_${name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")}`;

const defaultConfigFor = (type: MethodType): GatewayConfig => {
    if (type === "paypal") return { client_id: "", client_secret: "", environment: "sandbox", webhook_id: "" } as PayPalConfig;
    if (type === "stripe") return { publishable_key: "", secret_key: "", webhook_secret: "" } as StripeConfig;
    if (type === "qr") return { qr_image_url: "", recipient_name: "", account_details: "", instructions: "" } as QRConfig;
    return {};
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const MethodIcon = ({ type }: { type: MethodType }) => {
    if (type === "paypal") return <DollarSign className="h-4 w-4 text-primary" />;
    if (type === "qr") return <QrCode className="h-4 w-4 text-primary" />;
    return <CreditCard className="h-4 w-4 text-primary" />;
};

const SecretInput = ({
    value,
    placeholder,
    secretKey,
    showSecretFor,
    onToggle,
    onChange,
}: {
    value: string;
    placeholder: string;
    secretKey: string;
    showSecretFor: Record<string, boolean>;
    onToggle: (key: string) => void;
    onChange: (val: string) => void;
}) => (
    <div className="relative">
        <Input
            type={showSecretFor[secretKey] ? "text" : "password"}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="font-mono text-sm pr-10"
        />
        <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => onToggle(secretKey)}
        >
            {showSecretFor[secretKey] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
    </div>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const PaymentMethodsManager = () => {
    const { toast } = useToast();

    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [gatewayConfigs, setGatewayConfigs] = useState<Record<string, GatewayConfig>>({});
    const [savingConfigFor, setSavingConfigFor] = useState<string | null>(null);
    const [showSecretFor, setShowSecretFor] = useState<Record<string, boolean>>({});
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [addFormData, setAddFormData] = useState({ name: "", description: "" });

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
    const [editFormData, setEditFormData] = useState({ name: "", description: "" });

    useEffect(() => {
        fetchData();
    }, []);

    // -----------------------------------------------------------------------
    // Data fetching
    // -----------------------------------------------------------------------

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(apiUrl("/api/admin/payment-methods"));
            if (!response.ok) {
                let message = `HTTP ${response.status}`;
                try {
                    const json = await response.json();
                    message = json?.error ?? message;
                } catch {
                    // ignore parse errors
                }
                throw new Error(message);
            }

            const json = await response.json() as {
                methods: PaymentMethod[];
                configs?: Record<string, GatewayConfig>;
            };

            setMethods(json.methods || []);
            setGatewayConfigs(json.configs || {});
        } catch (error: any) {
            toast({ title: "Error loading payment methods", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    const getConfig = (method: PaymentMethod): GatewayConfig => {
        const key = getPaymentConfigKey(method.name);
        const type = getMethodType(method.name);
        return { ...defaultConfigFor(type), ...(gatewayConfigs[key] || {}) };
    };

    const updateConfigField = (method: PaymentMethod, field: string, value: string) => {
        const key = getPaymentConfigKey(method.name);
        const type = getMethodType(method.name);
        const current = { ...defaultConfigFor(type), ...(gatewayConfigs[key] || {}) };
        setGatewayConfigs((prev) => ({ ...prev, [key]: { ...current, [field]: value } }));
    };

    const toggleSecret = (secretKey: string) => {
        setShowSecretFor((prev) => ({ ...prev, [secretKey]: !prev[secretKey] }));
    };

    // -----------------------------------------------------------------------
    // Actions
    // -----------------------------------------------------------------------

    const toggleStatus = async (method: PaymentMethod) => {
        const newStatus = !method.is_enabled;
        setMethods((prev) => prev.map((m) => (m.id === method.id ? { ...m, is_enabled: newStatus } : m)));
        try {
            const response = await fetch(apiUrl(`/api/admin/payment-methods/${method.id}/status`), {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_enabled: newStatus }),
            });

            if (!response.ok) {
                let message = `HTTP ${response.status}`;
                try {
                    const json = await response.json();
                    message = json?.error ?? message;
                } catch {
                    // ignore parse errors
                }
                throw new Error(message);
            }

            toast({ title: `${method.name} ${newStatus ? "enabled" : "disabled"}` });
        } catch (error: any) {
            setMethods((prev) => prev.map((m) => (m.id === method.id ? { ...m, is_enabled: !newStatus } : m)));
            toast({ title: "Error updating method", description: error.message, variant: "destructive" });
        }
    };

    const saveConfig = async (method: PaymentMethod) => {
        const key = getPaymentConfigKey(method.name);
        const type = getMethodType(method.name);
        const config = { ...defaultConfigFor(type), ...(gatewayConfigs[key] || {}) };
        setSavingConfigFor(method.id);
        try {
            const response = await fetch(apiUrl(`/api/admin/payment-methods/${method.id}/config`), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ config }),
            });

            if (!response.ok) {
                let message = `HTTP ${response.status}`;
                try {
                    const json = await response.json();
                    message = json?.error ?? message;
                } catch {
                    // ignore parse errors
                }
                throw new Error(message);
            }

            toast({ title: `${method.name} configuration saved` });
        } catch (error: any) {
            toast({ title: "Error saving configuration", description: error.message, variant: "destructive" });
        } finally {
            setSavingConfigFor(null);
        }
    };

    const handleAddMethod = async () => {
        if (!addFormData.name.trim()) {
            toast({ title: "Name is required", variant: "destructive" });
            return;
        }
        try {
            const response = await fetch(apiUrl("/api/admin/payment-methods"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: addFormData.name.trim(),
                    description: addFormData.description.trim() || null,
                }),
            });

            if (!response.ok) {
                let message = `HTTP ${response.status}`;
                try {
                    const json = await response.json();
                    message = json?.error ?? message;
                } catch {
                    // ignore parse errors
                }
                throw new Error(message);
            }

            toast({ title: "Payment method added" });
            setIsAddDialogOpen(false);
            setAddFormData({ name: "", description: "" });
            fetchData();
        } catch (error: any) {
            toast({ title: "Error adding method", description: error.message, variant: "destructive" });
        }
    };

    const handleEditMethod = async () => {
        if (!editingMethod || !editFormData.name.trim()) {
            toast({ title: "Name is required", variant: "destructive" });
            return;
        }
        try {
            const response = await fetch(apiUrl(`/api/admin/payment-methods/${editingMethod.id}`), {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editFormData.name.trim(),
                    description: editFormData.description.trim() || null,
                }),
            });

            if (!response.ok) {
                let message = `HTTP ${response.status}`;
                try {
                    const json = await response.json();
                    message = json?.error ?? message;
                } catch {
                    // ignore parse errors
                }
                throw new Error(message);
            }

            toast({ title: "Payment method updated" });
            setIsEditDialogOpen(false);
            setEditingMethod(null);
            fetchData();
        } catch (error: any) {
            toast({ title: "Error updating method", description: error.message, variant: "destructive" });
        }
    };

    const handleDeleteMethod = async (id: string) => {
        const method = methods.find((m) => m.id === id);
        try {
            const response = await fetch(apiUrl(`/api/admin/payment-methods/${id}`), {
                method: "DELETE",
            });

            if (!response.ok) {
                let message = `HTTP ${response.status}`;
                try {
                    const json = await response.json();
                    message = json?.error ?? message;
                } catch {
                    // ignore parse errors
                }
                throw new Error(message);
            }

            setMethods((prev) => prev.filter((m) => m.id !== id));
            toast({ title: "Payment method deleted" });
        } catch (error: any) {
            toast({ title: "Error deleting method", description: error.message, variant: "destructive" });
        } finally {
            setDeleteConfirmId(null);
        }
    };

    // -----------------------------------------------------------------------
    // Config field renderers (per gateway type)
    // -----------------------------------------------------------------------

    const renderConfigFields = (method: PaymentMethod) => {
        const type = getMethodType(method.name);
        const config = getConfig(method) as any;

        if (type === "paypal") {
            return (
                <div className="grid gap-3">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client ID</Label>
                        <Input
                            placeholder="AaZs945Ql9T_FSF..."
                            value={config.client_id}
                            onChange={(e) => updateConfigField(method, "client_id", e.target.value)}
                            className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">Frontend public key (VITE_PAYPAL_CLIENT_ID)</p>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client Secret</Label>
                        <SecretInput
                            value={config.client_secret}
                            placeholder="EO0sC5rdEs..."
                            secretKey={`${method.id}_secret`}
                            showSecretFor={showSecretFor}
                            onToggle={toggleSecret}
                            onChange={(val) => updateConfigField(method, "client_secret", val)}
                        />
                        <p className="text-xs text-muted-foreground">Backend only — never exposed to browser (PAYPAL_CLIENT_SECRET)</p>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Environment</Label>
                        <Select
                            value={config.environment || "sandbox"}
                            onValueChange={(val) => updateConfigField(method, "environment", val)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                                <SelectItem value="live">Live (Production)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Webhook ID</Label>
                        <Input
                            placeholder="Optional — leave empty to skip signature verification in dev"
                            value={config.webhook_id}
                            onChange={(e) => updateConfigField(method, "webhook_id", e.target.value)}
                            className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">Required in production for webhook signature verification (PAYPAL_WEBHOOK_ID)</p>
                    </div>
                </div>
            );
        }

        if (type === "stripe") {
            return (
                <div className="grid gap-3">
                    <div className="flex items-start gap-2 rounded-md border border-yellow-500/40 bg-yellow-500/10 p-3 text-xs text-yellow-700 dark:text-yellow-400">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>
                            Stripe credentials are stored here for reference. The checkout flow uses a placeholder UI — wire up the Stripe SDK to complete integration.
                        </span>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Publishable Key</Label>
                        <Input
                            placeholder="pk_test_..."
                            value={config.publishable_key}
                            onChange={(e) => updateConfigField(method, "publishable_key", e.target.value)}
                            className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">Safe to expose in frontend (VITE_STRIPE_PUBLISHABLE_KEY)</p>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Secret Key</Label>
                        <SecretInput
                            value={config.secret_key}
                            placeholder="sk_test_..."
                            secretKey={`${method.id}_secret`}
                            showSecretFor={showSecretFor}
                            onToggle={toggleSecret}
                            onChange={(val) => updateConfigField(method, "secret_key", val)}
                        />
                        <p className="text-xs text-muted-foreground">Backend only (STRIPE_SECRET_KEY)</p>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Webhook Secret</Label>
                        <SecretInput
                            value={config.webhook_secret}
                            placeholder="whsec_..."
                            secretKey={`${method.id}_webhook`}
                            showSecretFor={showSecretFor}
                            onToggle={toggleSecret}
                            onChange={(val) => updateConfigField(method, "webhook_secret", val)}
                        />
                        <p className="text-xs text-muted-foreground">Backend only (STRIPE_WEBHOOK_SECRET)</p>
                    </div>
                </div>
            );
        }

        if (type === "qr") {
            return (
                <div className="grid gap-3">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">QR Code Image URL</Label>
                        <Input
                            placeholder="https://example.com/payment-qr.png"
                            value={config.qr_image_url}
                            onChange={(e) => updateConfigField(method, "qr_image_url", e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">The QR code image customers will scan to pay</p>
                    </div>

                    {config.qr_image_url && (
                        <div className="flex items-center justify-center p-4 rounded-md border border-border/50 bg-secondary/20">
                            <img
                                src={config.qr_image_url}
                                alt="QR Code Preview"
                                className="max-h-32 max-w-32 rounded object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recipient Name</Label>
                        <Input
                            placeholder="e.g. John Doe / Company Name"
                            value={config.recipient_name}
                            onChange={(e) => updateConfigField(method, "recipient_name", e.target.value)}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account / Wallet Details</Label>
                        <Input
                            placeholder="e.g. +1 (555) 123-4567 or wallet address"
                            value={config.account_details}
                            onChange={(e) => updateConfigField(method, "account_details", e.target.value)}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment Instructions</Label>
                        <Textarea
                            placeholder="e.g. Scan the QR code above with your banking app and send the exact amount shown. Include your order reference in the notes field."
                            value={config.instructions}
                            onChange={(e) => updateConfigField(method, "instructions", e.target.value)}
                            rows={3}
                            className="resize-none"
                        />
                    </div>
                </div>
            );
        }

        // Custom
        return (
            <div className="flex items-start gap-2 rounded-md border border-border/50 bg-secondary/10 p-3 text-xs text-muted-foreground">
                <Settings2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                This is a custom payment method. No additional gateway configuration is required.
            </div>
        );
    };

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-bold">Payment Methods</h3>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setAddFormData({ name: "", description: "" }); setIsAddDialogOpen(true); }}
                >
                    <Plus className="h-4 w-4 mr-1" /> Add Method
                </Button>
            </div>

            <p className="text-sm text-muted-foreground -mt-1">
                Enable or disable payment methods and configure their gateway credentials.
            </p>

            {/* Methods list */}
            {loading ? (
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">Loading payment methods...</CardContent>
                </Card>
            ) : methods.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        No payment methods configured. Add one to get started.
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {methods.map((method) => {
                        const type = getMethodType(method.name);
                        const isExpanded = expandedId === method.id;

                        return (
                            <Card
                                key={method.id}
                                className={`border-border/50 bg-card/50 transition-all ${isExpanded ? "ring-1 ring-primary/30" : ""}`}
                            >
                                {/* Method row */}
                                <div className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-9 w-9 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                                            <MethodIcon type={type} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-medium text-sm">{method.name}</p>
                                                <Badge
                                                    variant={method.is_enabled ? "default" : "outline"}
                                                    className={`text-[10px] px-1.5 py-0 ${method.is_enabled
                                                        ? "bg-green-500/20 text-green-600 border-green-500/30"
                                                        : "text-muted-foreground"
                                                        }`}
                                                >
                                                    {method.is_enabled ? "Active" : "Disabled"}
                                                </Badge>
                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground capitalize">
                                                    {type}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {method.description || "No description"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0 ml-4">
                                        <Switch
                                            checked={method.is_enabled}
                                            onCheckedChange={() => toggleStatus(method)}
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            title="Edit name / description"
                                            onClick={() => {
                                                setEditingMethod(method);
                                                setEditFormData({ name: method.name, description: method.description || "" });
                                                setIsEditDialogOpen(true);
                                            }}
                                        >
                                            <Settings2 className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            title={isExpanded ? "Collapse" : "Configure"}
                                            onClick={() => setExpandedId(isExpanded ? null : method.id)}
                                        >
                                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>

                                {/* Expandable config panel */}
                                {isExpanded && (
                                    <div className="border-t border-border/50 p-4 space-y-4 bg-secondary/5">
                                        <div>
                                            <h4 className="text-sm font-semibold">Gateway Configuration</h4>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Credentials and settings for this payment provider.
                                            </p>
                                        </div>

                                        {renderConfigFields(method)}

                                        <div className="flex items-center justify-between pt-3 border-t border-border/50">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => setDeleteConfirmId(method.id)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-1" /> Delete Method
                                            </Button>

                                            {type !== "custom" && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => saveConfig(method)}
                                                    disabled={savingConfigFor === method.id}
                                                >
                                                    {savingConfigFor === method.id ? (
                                                        "Saving..."
                                                    ) : (
                                                        <><Save className="h-4 w-4 mr-1" /> Save Config</>
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Add Method Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="sm:max-w-[400px] bg-background/95 backdrop-blur-md border-border/50">
                    <DialogHeader>
                        <DialogTitle>Add Payment Method</DialogTitle>
                        <DialogDescription>
                            Create a new payment option for customers. Methods named "PayPal", "Stripe", or "QR Code" get dedicated configuration fields automatically.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="addName">Method Name</Label>
                            <Input
                                id="addName"
                                placeholder="e.g. PayPal, Stripe, QR Code"
                                value={addFormData.name}
                                onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                                onKeyDown={(e) => e.key === "Enter" && handleAddMethod()}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="addDesc">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                            <Input
                                id="addDesc"
                                placeholder="Brief description shown to customers"
                                value={addFormData.description}
                                onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddMethod}>Add Method</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Method Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[400px] bg-background/95 backdrop-blur-md border-border/50">
                    <DialogHeader>
                        <DialogTitle>Edit Payment Method</DialogTitle>
                        <DialogDescription>Update the display name and description.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="editName">Method Name</Label>
                            <Input
                                id="editName"
                                value={editFormData.name}
                                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="editDesc">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                            <Input
                                id="editDesc"
                                value={editFormData.description}
                                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleEditMethod}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog
                open={!!deleteConfirmId}
                onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}
            >
                <AlertDialogContent className="bg-background/95 backdrop-blur-md border-border/50">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Payment Method?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove this payment method and its saved configuration. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteConfirmId && handleDeleteMethod(deleteConfirmId)}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

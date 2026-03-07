import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CreditCard, Package, ChevronLeft, ExternalLink, Download } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { WorkflowPagination } from "@/components/WorkflowPagination";

interface Transaction {
    id: string;
    amount: number;
    currency: string;
    status: string;
    payment_method: string;
    items: any[];
    created_at: string;
}

interface PurchasedWorkflow {
    id: string;
    workflow_id: string;
    purchase_date: string;
}

const ITEMS_PER_PAGE = 5;

export default function Purchases() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [purchasedWorkflows, setPurchasedWorkflows] = useState<PurchasedWorkflow[]>([]);
    const [loading, setLoading] = useState(true);
    const [workflowTitleMap, setWorkflowTitleMap] = useState<Record<string, string>>({});
    const [downloadableWorkflowIds, setDownloadableWorkflowIds] = useState<Set<string>>(new Set());
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const {
        currentPage: workflowPage,
        totalPages: workflowTotalPages,
        paginatedItems: paginatedPurchasedWorkflows,
        goToPage: goToWorkflowPage,
    } = usePagination({ items: purchasedWorkflows, itemsPerPage: ITEMS_PER_PAGE });

    const {
        currentPage: transactionPage,
        totalPages: transactionTotalPages,
        paginatedItems: paginatedTransactions,
        goToPage: goToTransactionPage,
    } = usePagination({ items: transactions, itemsPerPage: ITEMS_PER_PAGE });

    useEffect(() => {
        async function fetchHistory() {
            if (!user) return;
            setLoading(true);

            try {
                const [txRes, wfRes] = await Promise.all([
                    supabase
                        .from("transactions")
                        .select("*")
                        .eq("user_id", user.id)
                        .order("created_at", { ascending: false }),
                    supabase
                        .from("purchased_workflows")
                        .select("*")
                        .eq("user_id", user.id)
                        .order("purchase_date", { ascending: false })
                ]);

                if (txRes.error) throw txRes.error;
                if (wfRes.error) throw wfRes.error;

                setTransactions(txRes.data || []);
                const purchased = wfRes.data || [];
                setPurchasedWorkflows(purchased);

                const workflowIds = Array.from(
                    new Set((purchased as PurchasedWorkflow[]).map((wf) => wf.workflow_id)),
                ).filter((id) => !!id);

                if (workflowIds.length > 0) {
                    const { data: workflowRows, error: workflowError } = await supabase
                        .from("workflows")
                        .select("id, title, workflow_json")
                        .in("id", workflowIds);

                    if (!workflowError && workflowRows) {
                        const map: Record<string, string> = {};
                        const downloadable = new Set<string>();
                        for (const row of workflowRows as { id: string; title: string | null; workflow_json: unknown }[]) {
                            map[row.id] = row.title || "Untitled Workflow";
                            if (row.workflow_json != null && row.workflow_json !== "") {
                                downloadable.add(row.id);
                            }
                        }
                        setWorkflowTitleMap(map);
                        setDownloadableWorkflowIds(downloadable);
                    } else if (workflowError) {
                        console.error("Error fetching workflow titles:", workflowError);
                    }
                }
            } catch (error) {
                console.error("Error fetching purchase history:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchHistory();
    }, [user]);

    const getWorkflowTitle = (id: string) => {
        return workflowTitleMap[id] || "Unknown Workflow";
    };

    const handleDownload = async (workflowId: string) => {
        setDownloadingId(workflowId);
        try {
            const { data, error } = await supabase
                .from("workflows")
                .select("id, title, workflow_json")
                .eq("id", workflowId)
                .single();

            if (error) throw error;

            if (!data?.workflow_json) {
                toast({ title: "This workflow doesn't have a downloadable file yet", variant: "destructive" });
                return;
            }

            const raw = data.workflow_json;
            const jsonStr = typeof raw === "string" ? raw : JSON.stringify(raw);
            const pretty = JSON.stringify(JSON.parse(jsonStr), null, 2);
            const blob = new Blob([pretty], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${(data.title || "workflow").toLowerCase().replace(/\s+/g, "-")}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download error:", err);
            toast({ title: "Could not load workflow — please try again", variant: "destructive" });
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="container mx-auto px-4 pt-24 pb-12 max-w-5xl">
                <Button
                    variant="ghost"
                    className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
                    onClick={() => navigate("/profile")}
                >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Profile
                </Button>

                <div className="space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Purchase History</h1>
                        <p className="text-muted-foreground">Review your transactions and purchased assets</p>
                    </div>

                    <div className="grid gap-8">
                        {/* Purchased Workflows */}
                        <Card className="border-border bg-card">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Package className="h-5 w-5 text-primary" />
                                    <CardTitle>Purchased Workflows</CardTitle>
                                </div>
                                <CardDescription>Workflows you have unlocked for lifetime access</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="py-8 text-center text-muted-foreground">Loading...</div>
                                ) : purchasedWorkflows.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Workflow</TableHead>
                                                    <TableHead>Purchase Date</TableHead>
                                                    <TableHead className="text-right">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {paginatedPurchasedWorkflows.map((wf) => (
                                                    <TableRow key={wf.id}>
                                                        <TableCell className="font-medium">
                                                            {getWorkflowTitle(wf.workflow_id)}
                                                        </TableCell>
                                                        <TableCell>
                                                            {format(new Date(wf.purchase_date), "MMM d, yyyy")}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="inline-flex items-center gap-1">
                                                                <Button variant="ghost" size="sm" asChild>
                                                                    <Link to="/" className="inline-flex items-center gap-1">
                                                                        View <ExternalLink className="h-3 w-3" />
                                                                    </Link>
                                                                </Button>
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <span>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    disabled={downloadingId === wf.workflow_id || !downloadableWorkflowIds.has(wf.workflow_id)}
                                                                                    onClick={() => handleDownload(wf.workflow_id)}
                                                                                    className="inline-flex items-center gap-1"
                                                                                >
                                                                                    <Download className="h-3 w-3" />
                                                                                    {downloadingId === wf.workflow_id ? "..." : "Download"}
                                                                                </Button>
                                                                            </span>
                                                                        </TooltipTrigger>
                                                                        {!downloadableWorkflowIds.has(wf.workflow_id) && (
                                                                            <TooltipContent>
                                                                                <p>Download not available for this workflow</p>
                                                                            </TooltipContent>
                                                                        )}
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        <div className="mt-4">
                                            <WorkflowPagination
                                                currentPage={workflowPage}
                                                totalPages={workflowTotalPages}
                                                onPageChange={goToWorkflowPage}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
                                        <p>No purchased workflows yet.</p>
                                        <Button variant="link" asChild className="mt-2">
                                            <Link to="/">Browse Workflows</Link>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Transactions */}
                        <Card className="border-border bg-card">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-primary" />
                                    <CardTitle>Transactions</CardTitle>
                                </div>
                                <CardDescription>Payment history for subscriptions and individual items</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="py-8 text-center text-muted-foreground">Loading...</div>
                                ) : transactions.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Method</TableHead>
                                                    <TableHead>Amount</TableHead>
                                                    <TableHead>Items</TableHead>
                                                    <TableHead className="text-right">Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {paginatedTransactions.map((tx) => (
                                                    <TableRow key={tx.id}>
                                                        <TableCell>
                                                            {format(new Date(tx.created_at), "MMM d, yyyy")}
                                                        </TableCell>
                                                        <TableCell className="capitalize">
                                                            {tx.payment_method || "Stripe"}
                                                        </TableCell>
                                                        <TableCell className="font-mono">
                                                            {tx.currency === "VND"
                                                                ? `${Math.round(tx.amount).toLocaleString()} VND`
                                                                : `${tx.currency} ${tx.amount.toFixed(2)}`}
                                                        </TableCell>
                                                        <TableCell className="max-w-[200px] truncate" title={tx.items?.map((i: any) => i.name).join(", ")}>
                                                            {tx.items?.map((i: any) => i.name).join(", ") || "Subscription"}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Badge
                                                                variant={tx.status === 'completed' ? 'default' : 'secondary'}
                                                                className={`capitalize ${
                                                                    tx.status === 'completed'
                                                                        ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20'
                                                                        : tx.status === 'pending'
                                                                        ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                                                                        : tx.status === 'rejected'
                                                                        ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                                        : ''
                                                                }`}
                                                            >
                                                                {tx.status === 'pending' ? 'Awaiting confirmation' : tx.status}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        <div className="mt-4">
                                            <WorkflowPagination
                                                currentPage={transactionPage}
                                                totalPages={transactionTotalPages}
                                                onPageChange={goToTransactionPage}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
                                        No transactions found.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}

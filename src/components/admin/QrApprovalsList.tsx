import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { QrCode, Check, X, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { apiUrl } from "@/lib/api";

interface QrTransaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  items: Array<{ id: string; name: string; quantity: number; price: number }>;
  metadata: { qr_transaction_id?: string; sender_name?: string } | null;
  created_at: string;
  user: { full_name: string | null; email: string | null };
}

export function QrApprovalsList() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<QrTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/admin/transactions/pending"));
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setTransactions(data.transactions ?? []);
    } catch (err: any) {
      console.error("[QrApprovalsList] fetch error", err);
      toast({ title: "Failed to load pending transactions", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleApprove = async (id: string) => {
    setActioningId(id);
    try {
      const res = await fetch(apiUrl(`/api/admin/transactions/${id}/approve`), { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Transaction approved", description: "Fulfillment and notification sent." });
      await fetchPending();
    } catch (err: any) {
      toast({ title: "Approve failed", description: err.message, variant: "destructive" });
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActioningId(id);
    try {
      const res = await fetch(apiUrl(`/api/admin/transactions/${id}/reject`), { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Transaction rejected" });
      await fetchPending();
    } catch (err: any) {
      toast({ title: "Reject failed", description: err.message, variant: "destructive" });
    } finally {
      setActioningId(null);
    }
  };

  const formatAmount = (amount: number, currency: string) =>
    currency === "VND"
      ? `${Math.round(amount).toLocaleString("vi-VN")} VND`
      : `${currency} ${amount.toFixed(2)}`;

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            <CardTitle>QR Approvals</CardTitle>
            {transactions.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {transactions.length}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={fetchPending} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <CardDescription>Pending QR Code payments awaiting admin approval.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
            No pending QR transactions.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Sender</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-xs">
                      {tx.metadata?.qr_transaction_id || "—"}
                    </TableCell>
                    <TableCell>{tx.metadata?.sender_name || "—"}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatAmount(tx.amount, tx.currency)}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{tx.user.full_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{tx.user.email || tx.user_id}</div>
                    </TableCell>
                    <TableCell
                      className="max-w-[160px] truncate text-sm"
                      title={tx.items?.map((i) => i.name).join(", ")}
                    >
                      {tx.items?.map((i) => i.name).join(", ") || "—"}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {format(new Date(tx.created_at), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          disabled={actioningId === tx.id}
                          onClick={() => handleApprove(tx.id)}
                        >
                          <Check className="h-3 w-3 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={actioningId === tx.id}
                          onClick={() => handleReject(tx.id)}
                        >
                          <X className="h-3 w-3 mr-1" /> Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { apiUrl } from "@/lib/api";

interface FeedbackItem {
    id: string;
    user_id: string | null;
    email: string;
    name: string | null;
    subject: string | null;
    message: string;
    created_at: string;
}

export const FeedbackManager = () => {
    const [items, setItems] = useState<FeedbackItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const fetchFeedback = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(apiUrl("/api/admin/feedback"));
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const data: FeedbackItem[] = await res.json();
            setItems(data);
        } catch (err: any) {
            setError(err.message ?? "Failed to load feedback.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchFeedback(); }, [fetchFeedback]);

    function toggleExpand(id: string) {
        setExpanded((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            Feedback submissions
                        </CardTitle>
                        <CardDescription>Customer feedback, newest first.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchFeedback} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {loading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading…</div>
                ) : error ? (
                    <div className="p-8 text-center text-destructive">{error}</div>
                ) : items.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">No feedback submissions yet.</div>
                ) : (
                    <div className="divide-y divide-border/50">
                        {items.map((item) => {
                            const isExpanded = expanded.has(item.id);
                            const truncated = item.message.length > 120 && !isExpanded;
                            return (
                                <div key={item.id} className="p-4 hover:bg-secondary/5 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-2">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{item.email}</span>
                                            {item.name && (
                                                <span className="text-xs text-muted-foreground">{item.name}</span>
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground shrink-0">
                                            {format(new Date(item.created_at), "dd MMM yyyy, HH:mm")}
                                        </span>
                                    </div>
                                    {item.subject && (
                                        <p className="text-sm font-medium mb-1">{item.subject}</p>
                                    )}
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {truncated ? `${item.message.slice(0, 120)}…` : item.message}
                                    </p>
                                    {item.message.length > 120 && (
                                        <button
                                            onClick={() => toggleExpand(item.id)}
                                            className="text-xs text-primary hover:underline mt-1"
                                        >
                                            {isExpanded ? "Show less" : "Show more"}
                                        </button>
                                    )}
                                    {item.user_id && (
                                        <p className="text-xs text-muted-foreground mt-1">User ID: {item.user_id}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

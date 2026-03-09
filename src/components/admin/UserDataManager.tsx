import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { apiUrl } from "@/lib/api";

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const UserDataManager = () => {
    const { toast } = useToast();
    const [identifyBy, setIdentifyBy] = useState<"email" | "userId">("email");
    const [email, setEmail] = useState("");
    const [userId, setUserId] = useState("");
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const getPayload = (): { email?: string; userId?: string } | null => {
        if (identifyBy === "email") {
            const trimmed = email.trim();
            if (!trimmed) return null;
            return { email: trimmed };
        }
        const trimmed = userId.trim();
        if (!trimmed || !UUID_REGEX.test(trimmed)) return null;
        return { userId: trimmed };
    };

    const handleOpenConfirm = () => {
        if (!getPayload()) {
            toast({
                title: "Invalid input",
                description:
                    identifyBy === "email"
                        ? "Enter a valid email address."
                        : "Enter a valid user ID (UUID).",
                variant: "destructive",
            });
            return;
        }
        setConfirmOpen(true);
    };

    const handleDelete = async () => {
        const payload = getPayload();
        if (!payload) return;

        setDeleting(true);
        try {
            const res = await fetch(apiUrl("/api/admin/users/delete"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                toast({
                    title: "Delete failed",
                    description: data.error ?? res.statusText,
                    variant: "destructive",
                });
                return;
            }

            toast({
                title: "User deleted",
                description: "Account and all related data have been removed.",
            });
            setConfirmOpen(false);
            setEmail("");
            setUserId("");
        } catch (err) {
            toast({
                title: "Error",
                description: err instanceof Error ? err.message : "Request failed",
                variant: "destructive",
            });
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            <Card className="border-destructive/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <UserX className="h-5 w-5" />
                        Delete user account &amp; data
                    </CardTitle>
                    <CardDescription>
                        Permanently delete a user from Auth and all related data (profile, subscriptions,
                        transactions, purchased workflows, activity logs). Same effect as the SQL script{" "}
                        <code className="text-xs bg-muted px-1 rounded">scripts/delete-user-data.sql</code>.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <RadioGroup
                        value={identifyBy}
                        onValueChange={(v) => setIdentifyBy(v as "email" | "userId")}
                        className="flex gap-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="email" id="by-email" />
                            <Label htmlFor="by-email">By email</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="userId" id="by-user-id" />
                            <Label htmlFor="by-user-id">By user ID (UUID)</Label>
                        </div>
                    </RadioGroup>

                    {identifyBy === "email" ? (
                        <div className="space-y-2">
                            <Label htmlFor="delete-email">Email</Label>
                            <Input
                                id="delete-email"
                                type="email"
                                placeholder="user@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="max-w-sm"
                            />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label htmlFor="delete-user-id">User ID</Label>
                            <Input
                                id="delete-user-id"
                                type="text"
                                placeholder="00000000-0000-0000-0000-000000000000"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                className="max-w-sm font-mono text-sm"
                            />
                        </div>
                    )}

                    <Button variant="destructive" onClick={handleOpenConfirm}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete user
                    </Button>
                </CardContent>
            </Card>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete user permanently?</DialogTitle>
                        <DialogDescription>
                            This will remove the user from Auth and delete their profile, subscriptions,
                            transactions, purchased workflows, and activity logs. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? "Deleting…" : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

import { useEffect, useState, FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreditCard, ChevronRight, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { logActivity } from "@/utils/activity";

export default function Profile() {
    const { user, signOut } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState("");
    const [fullName, setFullName] = useState("");
    const [website, setWebsite] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");

    useEffect(() => {
        let ignore = false;
        async function getProfile() {
            if (!user) return;

            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from("profiles")
                    .select("username, full_name, website, avatar_url")
                    .eq("id", user.id)
                    .single();

                if (!ignore) {
                    if (error) {
                        console.warn("Error fetching profile:", error);
                    } else if (data) {
                        setUsername(data.username || "");
                        setFullName(data.full_name || "");
                        setWebsite(data.website || "");
                        setAvatarUrl(data.avatar_url || "");
                    }
                }
            } catch (err) {
                console.error("Unexpected error fetching profile:", err);
            } finally {
                if (!ignore) setLoading(false);
            }
        }

        getProfile();

        return () => {
            ignore = true;
        };
    }, [user]);

    async function updateProfile(event: FormEvent) {
        event.preventDefault();

        if (!user) {
            toast({
                variant: "destructive",
                title: "Not authenticated",
                description: "You must be signed in to update your profile.",
            });
            return;
        }

        setLoading(true);
        try {
            const updates = {
                id: user.id,
                username,
                full_name: fullName,
                website,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase.from("profiles").upsert(updates);

            if (error) {
                toast({
                    variant: "destructive",
                    title: "Error updating profile",
                    description: error.message,
                });
            } else {
                await logActivity({
                    userId: user.id,
                    action: "update_profile",
                    entityType: "profile",
                    entityId: user.id,
                    description: "Updated profile information",
                    metadata: { username, full_name: fullName, website }
                });

                toast({
                    title: "Profile updated",
                    description: "Your profile has been updated successfully.",
                });
            }
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Unexpected Error",
                description: err.message,
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="container mx-auto px-4 pt-24 pb-12">
                <div className="max-w-md mx-auto space-y-8">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold">Profile</h1>
                        <p className="text-muted-foreground">Manage your account settings</p>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-6 space-y-6 shadow-sm">
                        <div className="flex flex-col items-center gap-4">
                            <Avatar className="h-24 w-24 border-2 border-primary/10">
                                <AvatarImage src={avatarUrl} />
                                <AvatarFallback className="text-2xl bg-primary/5 text-primary font-bold">
                                    {fullName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </div>

                        <form onSubmit={updateProfile} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="text" value={user?.email || ""} disabled className="bg-muted/50 cursor-not-allowed" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="johndoe"
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input
                                    id="fullName"
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="John Doe"
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="website">Website</Label>
                                <Input
                                    id="website"
                                    type="url"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    placeholder="https://example.com"
                                    disabled={loading}
                                />
                            </div>

                            <Button type="submit" className="w-full font-semibold" disabled={loading}>
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                                        Saving...
                                    </span>
                                ) : "Update Profile"}
                            </Button>
                        </form>

                        <div className="pt-4 border-t border-border">
                            <Button
                                variant="outline"
                                className="w-full justify-between group hover:border-primary/50 hover:bg-primary/5 transition-all"
                                asChild
                            >
                                <Link to="/purchases">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-primary" />
                                        <span>Purchase History</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                                </Link>
                            </Button>
                        </div>

                        <div className="pt-4 border-t border-border">
                            <Button
                                variant="ghost"
                                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => signOut()}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}

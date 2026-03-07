import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, FileText, CreditCard, Box, Settings, Clock, BarChart2, UserX, MessageSquare, LayoutList } from "lucide-react";
import { WorkflowManager } from "@/components/admin/WorkflowManager";
import { DocumentManager } from "@/components/admin/DocumentManager";
import { SettingsManager } from "@/components/admin/SettingsManager";
import { SalesDashboard } from "@/components/admin/SalesDashboard";
import { UserDataManager } from "@/components/admin/UserDataManager";
import { QrApprovalsList } from "@/components/admin/QrApprovalsList";
import { FeedbackManager } from "@/components/admin/FeedbackManager";
import { CarouselManager } from "@/components/admin/CarouselManager";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

interface DashboardCounts {
    workflows: number;
    documents: number;
    paymentMethods: number;
    subscriptions: number;
}

/** Admin portal: uses shared Supabase client (schema "app") for activity_logs, documents, settings; backend API for workflows/dashboard/users. */
const Admin = () => {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [counts, setCounts] = useState<DashboardCounts | null>(null);

    useEffect(() => {
        if (activeTab === "dashboard") {
            fetchDashboard();
        }
    }, [activeTab]);

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            const [{ data, error }, countsRes] = await Promise.all([
                supabase
                    .from("activity_logs")
                    .select(`
                        *,
                        profiles:user_id (
                            full_name,
                            avatar_url
                        )
                    `)
                    .order("created_at", { ascending: false })
                    .limit(10),
                fetch(`${API}/api/admin/dashboard/counts`),
            ]);

            if (error) throw error;
            setActivities(data || []);

            if (countsRes.ok) {
                const countsData = await countsRes.json();
                setCounts(countsData);
            }
        } catch (error) {
            console.error("Error fetching dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />

            <div className="container mx-auto px-4 pt-28 pb-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">CMS Dashboard</h1>
                        <p className="text-muted-foreground">Manage your workflows, documents, and system settings.</p>
                    </div>
                </div>

                <Tabs defaultValue="dashboard" className="space-y-6" onValueChange={setActiveTab}>
                    <div className="flex flex-col md:flex-row gap-6">
                        <aside className="w-full md:w-64 shrink-0">
                            <TabsList className="flex flex-col h-auto w-full bg-transparent gap-1 p-0">
                                <TabsTrigger
                                    value="dashboard"
                                    className="w-full justify-start gap-3 px-4 py-3 h-auto data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20"
                                >
                                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                                </TabsTrigger>
                                <TabsTrigger
                                    value="workflows"
                                    className="w-full justify-start gap-3 px-4 py-3 h-auto data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20"
                                >
                                    <Box className="h-4 w-4" /> Workflows
                                </TabsTrigger>
                                <TabsTrigger
                                    value="documents"
                                    className="w-full justify-start gap-3 px-4 py-3 h-auto data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20"
                                >
                                    <FileText className="h-4 w-4" /> Documents
                                </TabsTrigger>
                                <TabsTrigger
                                    value="payments"
                                    className="w-full justify-start gap-3 px-4 py-3 h-auto data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20"
                                >
                                    <CreditCard className="h-4 w-4" /> Payments
                                </TabsTrigger>
                                <TabsTrigger
                                    value="sales"
                                    className="w-full justify-start gap-3 px-4 py-3 h-auto data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20"
                                >
                                    <BarChart2 className="h-4 w-4" /> Sales
                                </TabsTrigger>
                                <TabsTrigger
                                    value="users"
                                    className="w-full justify-start gap-3 px-4 py-3 h-auto data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20"
                                >
                                    <UserX className="h-4 w-4" /> Users
                                </TabsTrigger>
                                <TabsTrigger
                                    value="carousel"
                                    className="w-full justify-start gap-3 px-4 py-3 h-auto data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20"
                                >
                                    <LayoutList className="h-4 w-4" /> Carousel
                                </TabsTrigger>
                                <TabsTrigger
                                    value="feedback"
                                    className="w-full justify-start gap-3 px-4 py-3 h-auto data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20"
                                >
                                    <MessageSquare className="h-4 w-4" /> Feedback
                                </TabsTrigger>
                                <TabsTrigger
                                    value="settings"
                                    className="w-full justify-start gap-3 px-4 py-3 h-auto data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20"
                                >
                                    <Settings className="h-4 w-4" /> Settings
                                </TabsTrigger>
                            </TabsList>
                        </aside>

                        <main className="flex-1 min-w-0">
                            <TabsContent value="dashboard" className="m-0 space-y-6">
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
                                            <Box className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                {counts == null ? "—" : counts.workflows.toLocaleString()}
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                {counts == null ? "—" : counts.documents.toLocaleString()}
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Payment Types</CardTitle>
                                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                {counts == null ? "—" : counts.paymentMethods.toLocaleString()}
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
                                            <Settings className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                {counts == null ? "—" : counts.subscriptions.toLocaleString()}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Clock className="h-5 w-5 text-primary" />
                                            Recent Activity
                                        </CardTitle>
                                        <CardDescription>Visualizing recent changes in the CMS.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="divide-y divide-border/50">
                                            {loading ? (
                                                <div className="p-8 text-center text-muted-foreground">
                                                    Loading activities...
                                                </div>
                                            ) : activities.length === 0 ? (
                                                <div className="p-8 text-center text-muted-foreground">
                                                    No recent activity found.
                                                </div>
                                            ) : (
                                                activities.map((activity) => (
                                                    <div key={activity.id} className="p-4 flex items-start gap-4 hover:bg-secondary/5 transition-colors">
                                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                            <Clock className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium leading-none mb-1">
                                                                {activity.description}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <span>{activity.profiles?.full_name || "System"}</span>
                                                                <span>•</span>
                                                                <span>{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="workflows" className="m-0 space-y-6">
                                <WorkflowManager />
                            </TabsContent>

                            <TabsContent value="documents" className="m-0 space-y-6">
                                <DocumentManager />
                            </TabsContent>

                            <TabsContent value="payments" className="m-0 space-y-6">
                                <QrApprovalsList />
                                <SettingsManager />
                            </TabsContent>

                            <TabsContent value="sales" className="m-0 space-y-6">
                                <SalesDashboard />
                            </TabsContent>

                            <TabsContent value="users" className="m-0 space-y-6">
                                <UserDataManager />
                            </TabsContent>

                            <TabsContent value="carousel" className="m-0 space-y-6">
                                <CarouselManager />
                            </TabsContent>

                            <TabsContent value="feedback" className="m-0 space-y-6">
                                <FeedbackManager />
                            </TabsContent>

                            <TabsContent value="settings" className="m-0 space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>General Settings</CardTitle>
                                        <CardDescription>Global configuration for the Workflow Canvas CMS.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground">CMS settings will be implemented here.</p>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </main>
                    </div>
                </Tabs>
            </div>
            <Footer />
        </div>
    );
};

export default Admin;

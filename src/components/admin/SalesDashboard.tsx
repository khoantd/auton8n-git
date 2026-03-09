import { useState, useEffect, useCallback } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import {
    ShoppingCart,
    DollarSign,
    Users,
    TrendingUp,
    TrendingDown,
    Minus,
    Package,
    Clock,
    Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";
import { apiUrl } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Period = "today" | "7d" | "30d" | "all";

interface Stats {
    totalPurchases: number;
    totalRevenue: number;
    revenueUsd: number;
    revenueVnd: number;
    uniqueCustomers: number;
    avgOrderValue: number;
    avgOrderValueUsd: number;
    avgOrderValueVnd: number;
    trends: {
        revenue: number | null;
        revenueUsd: number | null;
        revenueVnd: number | null;
        purchases: number | null;
        customers: number | null;
    };
}

interface ChartPoint {
    date: string;
    revenueUsd: number;
    revenueVnd: number;
    count: number;
}

interface BestSeller {
    id: string;
    title: string;
    price: number;
    category: string | null;
    sales: number;
    revenue: number;
    revenueUsd: number;
    revenueVnd: number;
}

interface Customer {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    first_purchase: string;
    total_spent: number;
    total_spent_usd: number;
    total_spent_vnd: number;
}

interface Purchase {
    id: string;
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
    amount: number;
    currency: string;
    payment_method: string;
    items: unknown;
    created_at: string;
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

function fmt(n: number) {
    return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Format an amount with its currency: no decimals + " VND" suffix for VND, "$" prefix for USD. */
function formatMoney(amount: number, currency: string): string {
    if (currency === "VND") {
        return `${Math.round(amount).toLocaleString("vi-VN")} VND`;
    }
    return `$${fmt(amount)}`;
}

/** Short-form formatter for KPI cards. */
function fmtShort(n: number, currency = "USD"): string {
    if (currency === "VND") {
        if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B VND`;
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M VND`;
        if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K VND`;
        return `${Math.round(n).toLocaleString("vi-VN")} VND`;
    }
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
    return `$${fmt(n)}`;
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function Trend({ value, label }: { value: number | null; label?: string }) {
    if (value === null)
        return <span className="text-xs text-muted-foreground">vs prev period</span>;
    const positive = value >= 0;
    const Icon = value === 0 ? Minus : positive ? TrendingUp : TrendingDown;
    return (
        <span
            className={`flex items-center gap-1 text-xs font-medium ${
                positive ? "text-emerald-500" : "text-red-500"
            }`}
        >
            <Icon className="h-3 w-3" />
            {Math.abs(value).toFixed(1)}% vs prev{label ? ` (${label})` : ""}
        </span>
    );
}

function Avatar({ name, url }: { name: string | null; url: string | null }) {
    const initials = (name ?? "?")
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    return url ? (
        <img src={url} alt={name ?? ""} className="h-8 w-8 rounded-full object-cover shrink-0" />
    ) : (
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-semibold text-primary">
            {initials}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function SkeletonCard() {
    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
                <div className="h-8 w-20 bg-muted animate-pulse rounded mb-1" />
                <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            </CardContent>
        </Card>
    );
}

// ---------------------------------------------------------------------------
// Period selector
// ---------------------------------------------------------------------------

const PERIODS: { label: string; value: Period }[] = [
    { label: "Today", value: "today" },
    { label: "7 days", value: "7d" },
    { label: "30 days", value: "30d" },
    { label: "All time", value: "all" },
];

// ---------------------------------------------------------------------------
// Custom chart tooltip
// ---------------------------------------------------------------------------

function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    const usdEntry = payload.find((p: any) => p.dataKey === "revenueUsd");
    const vndEntry = payload.find((p: any) => p.dataKey === "revenueVnd");
    const usdVal: number = usdEntry?.value ?? 0;
    const vndVal: number = vndEntry?.value ?? 0;
    const count: number = payload[0]?.payload?.count ?? 0;
    return (
        <div className="rounded-lg border border-border bg-background/95 px-3 py-2 shadow-lg text-sm">
            <p className="font-medium mb-1">{label}</p>
            {usdVal > 0 && (
                <p className="text-primary font-semibold">{formatMoney(usdVal, "USD")}</p>
            )}
            {vndVal > 0 && (
                <p className="text-emerald-500 font-semibold">{formatMoney(vndVal, "VND")}</p>
            )}
            {usdVal === 0 && vndVal === 0 && (
                <p className="text-muted-foreground">No revenue</p>
            )}
            <p className="text-muted-foreground text-xs mt-0.5">{count} orders</p>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SalesDashboard() {
    const [period, setPeriod] = useState<Period>("30d");
    const [stats, setStats] = useState<Stats | null>(null);
    const [chart, setChart] = useState<ChartPoint[]>([]);
    const [bestSellers, setBestSellers] = useState<BestSeller[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const chartDays = period === "today" ? 1 : period === "7d" ? 7 : period === "30d" ? 30 : 90;

    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [statsRes, chartRes, sellersRes, customersRes, purchasesRes] = await Promise.all([
                fetch(apiUrl(`/api/admin/dashboard/stats?period=${period}`)),
                fetch(apiUrl(`/api/admin/dashboard/revenue-chart?days=${chartDays}`)),
                fetch(apiUrl("/api/admin/dashboard/best-sellers?limit=8")),
                fetch(apiUrl(`/api/admin/dashboard/new-customers?limit=8&period=${period}`)),
                fetch(apiUrl("/api/admin/dashboard/recent-purchases?limit=10")),
            ]);

            const [statsData, chartData, sellersData, customersData, purchasesData] =
                await Promise.all([
                    statsRes.json(),
                    chartRes.json(),
                    sellersRes.json(),
                    customersRes.json(),
                    purchasesRes.json(),
                ]);

            setStats(statsData);
            setChart(chartData.chart ?? []);
            setBestSellers(sellersData.bestSellers ?? []);
            setCustomers(customersData.customers ?? []);
            setPurchases(purchasesData.purchases ?? []);
        } catch (e: any) {
            setError(e.message ?? "Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    }, [period, chartDays]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // Format chart date labels
    const formattedChart = chart.map((p) => ({
        ...p,
        label:
            chartDays <= 7
                ? format(new Date(p.date), "EEE d")
                : format(new Date(p.date), "MMM d"),
    }));

    // Determine which currencies are active in the chart
    const hasUsdChart = chart.some((p) => p.revenueUsd > 0);
    const hasVndChart = chart.some((p) => p.revenueVnd > 0);

    return (
        <div className="space-y-6">
            {/* Header + period selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-semibold">Sales Dashboard</h2>
                    <p className="text-sm text-muted-foreground">
                        Revenue, purchases, and customer insights
                    </p>
                </div>
                <div className="flex gap-1 rounded-lg border border-border p-1 bg-muted/30 w-fit">
                    {PERIODS.map((p) => (
                        <button
                            key={p.value}
                            onClick={() => setPeriod(p.value)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                period === p.value
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            {/* KPI cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {loading ? (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : (
                    <>
                        {/* New Purchases */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium">New Purchases</CardTitle>
                                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {stats == null ? "—" : (stats.totalPurchases ?? 0).toLocaleString()}
                                </div>
                                <Trend value={stats?.trends?.purchases ?? null} />
                            </CardContent>
                        </Card>

                        {/* Revenue — shows USD and/or VND */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="space-y-1">
                                {stats == null ? (
                                    <div className="text-2xl font-bold">—</div>
                                ) : (
                                    <>
                                        {(stats.revenueUsd ?? 0) > 0 && (
                                            <div>
                                                <div className="text-2xl font-bold">
                                                    {fmtShort(stats.revenueUsd, "USD")}
                                                </div>
                                                <Trend value={stats.trends?.revenueUsd ?? null} label="USD" />
                                            </div>
                                        )}
                                        {(stats.revenueVnd ?? 0) > 0 && (
                                            <div>
                                                <div
                                                    className={`font-bold text-emerald-600 dark:text-emerald-400 ${
                                                        (stats.revenueUsd ?? 0) > 0 ? "text-lg" : "text-2xl"
                                                    }`}
                                                >
                                                    {fmtShort(stats.revenueVnd, "VND")}
                                                </div>
                                                <Trend value={stats.trends?.revenueVnd ?? null} label="VND" />
                                            </div>
                                        )}
                                        {(stats.revenueUsd ?? 0) === 0 && (stats.revenueVnd ?? 0) === 0 && (
                                            <div className="text-2xl font-bold">$0.00</div>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* New Customers */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {stats == null ? "—" : (stats.uniqueCustomers ?? 0).toLocaleString()}
                                </div>
                                <Trend value={stats?.trends?.customers ?? null} />
                            </CardContent>
                        </Card>

                        {/* Avg. Order Value — shows USD and/or VND */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="space-y-1">
                                {stats == null ? (
                                    <div className="text-2xl font-bold">—</div>
                                ) : (
                                    <>
                                        {(stats.avgOrderValueUsd ?? 0) > 0 && (
                                            <div>
                                                <div className="text-2xl font-bold">
                                                    {formatMoney(stats.avgOrderValueUsd, "USD")}
                                                </div>
                                                <span className="text-xs text-muted-foreground">USD avg order</span>
                                            </div>
                                        )}
                                        {(stats.avgOrderValueVnd ?? 0) > 0 && (
                                            <div>
                                                <div
                                                    className={`font-bold text-emerald-600 dark:text-emerald-400 ${
                                                        (stats.avgOrderValueUsd ?? 0) > 0 ? "text-lg" : "text-2xl"
                                                    }`}
                                                >
                                                    {fmtShort(stats.avgOrderValueVnd, "VND")}
                                                </div>
                                                <span className="text-xs text-muted-foreground">VND avg order</span>
                                            </div>
                                        )}
                                        {(stats.avgOrderValueUsd ?? 0) === 0 &&
                                            (stats.avgOrderValueVnd ?? 0) === 0 && (
                                                <>
                                                    <div className="text-2xl font-bold">$0.00</div>
                                                    <span className="text-xs text-muted-foreground">per transaction</span>
                                                </>
                                            )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {/* Revenue chart — dual series: USD (left axis) + VND (right axis) */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Revenue Over Time
                    </CardTitle>
                    <CardDescription>
                        Daily revenue for the last {chartDays === 1 ? "24 hours" : `${chartDays} days`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="h-56 bg-muted animate-pulse rounded" />
                    ) : chart.length === 0 ? (
                        <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
                            No revenue data for this period.
                        </div>
                    ) : (
                        <>
                            {/* Inline legend */}
                            <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
                                {hasUsdChart && (
                                    <span className="flex items-center gap-1.5">
                                        <span
                                            className="inline-block h-2 w-4 rounded"
                                            style={{ backgroundColor: "hsl(var(--primary))" }}
                                        />
                                        USD
                                    </span>
                                )}
                                {hasVndChart && (
                                    <span className="flex items-center gap-1.5">
                                        <span
                                            className="inline-block h-2 w-4 rounded"
                                            style={{ backgroundColor: "hsl(142 71% 45%)" }}
                                        />
                                        VND
                                    </span>
                                )}
                            </div>
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart
                                    data={formattedChart}
                                    margin={{
                                        left: 0,
                                        right: hasVndChart ? 56 : 8,
                                        top: 4,
                                        bottom: 0,
                                    }}
                                >
                                    <defs>
                                        <linearGradient id="usdGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop
                                                offset="5%"
                                                stopColor="hsl(var(--primary))"
                                                stopOpacity={0.25}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="hsl(var(--primary))"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                        <linearGradient id="vndGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop
                                                offset="5%"
                                                stopColor="hsl(142 71% 45%)"
                                                stopOpacity={0.2}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="hsl(142 71% 45%)"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="hsl(var(--border))"
                                    />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                        tickLine={false}
                                        axisLine={false}
                                        interval="preserveStartEnd"
                                    />
                                    {/* Left Y-axis: USD */}
                                    <YAxis
                                        yAxisId="usd"
                                        orientation="left"
                                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(v) =>
                                            `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                                        }
                                        width={48}
                                    />
                                    {/* Right Y-axis: VND — only rendered when VND data exists */}
                                    {hasVndChart && (
                                        <YAxis
                                            yAxisId="vnd"
                                            orientation="right"
                                            tick={{
                                                fontSize: 11,
                                                fill: "hsl(var(--muted-foreground))",
                                            }}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(v) =>
                                                v >= 1_000_000_000
                                                    ? `${(v / 1_000_000_000).toFixed(0)}B`
                                                    : v >= 1_000_000
                                                    ? `${(v / 1_000_000).toFixed(0)}M`
                                                    : v >= 1_000
                                                    ? `${(v / 1_000).toFixed(0)}K`
                                                    : String(v)
                                            }
                                            width={52}
                                        />
                                    )}
                                    <Tooltip content={<ChartTooltip />} />
                                    <Area
                                        yAxisId="usd"
                                        type="monotone"
                                        dataKey="revenueUsd"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={2}
                                        fill="url(#usdGrad)"
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                    />
                                    {hasVndChart && (
                                        <Area
                                            yAxisId="vnd"
                                            type="monotone"
                                            dataKey="revenueVnd"
                                            stroke="hsl(142 71% 45%)"
                                            strokeWidth={2}
                                            fill="url(#vndGrad)"
                                            dot={false}
                                            activeDot={{ r: 4 }}
                                        />
                                    )}
                                </AreaChart>
                            </ResponsiveContainer>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Best sellers + New customers */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Best sellers */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Award className="h-4 w-4 text-primary" />
                            Best Selling Items
                        </CardTitle>
                        <CardDescription>All-time top workflows by number of sales</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-4 space-y-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                                ))}
                            </div>
                        ) : bestSellers.length === 0 ? (
                            <div className="p-8 text-center text-sm text-muted-foreground">
                                No sales data yet.
                            </div>
                        ) : (
                            <div className="divide-y divide-border/50">
                                {bestSellers.map((item, idx) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/5 transition-colors"
                                    >
                                        <span className="w-5 text-xs font-bold text-muted-foreground shrink-0">
                                            #{idx + 1}
                                        </span>
                                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                            <Package className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{item.title}</p>
                                            {item.category && (
                                                <Badge variant="secondary" className="text-xs mt-0.5 h-4">
                                                    {item.category}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0">
                                            {item.revenueUsd > 0 && (
                                                <p className="text-sm font-semibold">
                                                    {formatMoney(item.revenueUsd, "USD")}
                                                </p>
                                            )}
                                            {item.revenueVnd > 0 && (
                                                <p
                                                    className={`font-semibold text-emerald-600 dark:text-emerald-400 ${
                                                        item.revenueUsd > 0 ? "text-xs" : "text-sm"
                                                    }`}
                                                >
                                                    {formatMoney(item.revenueVnd, "VND")}
                                                </p>
                                            )}
                                            {item.revenueUsd === 0 && item.revenueVnd === 0 && (
                                                <p className="text-sm font-semibold text-muted-foreground">—</p>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                {item.sales} {item.sales === 1 ? "sale" : "sales"}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* New customers */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Users className="h-4 w-4 text-primary" />
                            New Customers
                        </CardTitle>
                        <CardDescription>First-time buyers during the selected period</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-4 space-y-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                                ))}
                            </div>
                        ) : customers.length === 0 ? (
                            <div className="p-8 text-center text-sm text-muted-foreground">
                                No new customers in this period.
                            </div>
                        ) : (
                            <div className="divide-y divide-border/50">
                                {customers.map((c) => (
                                    <div
                                        key={c.id}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/5 transition-colors"
                                    >
                                        <Avatar name={c.full_name} url={c.avatar_url} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {c.full_name ?? "Anonymous"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Joined{" "}
                                                {formatDistanceToNow(new Date(c.first_purchase), {
                                                    addSuffix: true,
                                                })}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            {c.total_spent_usd > 0 && (
                                                <p className="text-sm font-semibold">
                                                    {formatMoney(c.total_spent_usd, "USD")}
                                                </p>
                                            )}
                                            {c.total_spent_vnd > 0 && (
                                                <p
                                                    className={`font-semibold text-emerald-600 dark:text-emerald-400 ${
                                                        c.total_spent_usd > 0 ? "text-xs" : "text-sm"
                                                    }`}
                                                >
                                                    {formatMoney(c.total_spent_vnd, "VND")}
                                                </p>
                                            )}
                                            {c.total_spent_usd === 0 && c.total_spent_vnd === 0 && (
                                                <p className="text-sm font-semibold text-muted-foreground">—</p>
                                            )}
                                            <p className="text-xs text-muted-foreground">spent</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent purchases */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Clock className="h-4 w-4 text-primary" />
                        Recent Purchases
                    </CardTitle>
                    <CardDescription>Latest 10 completed transactions</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-4 space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                            ))}
                        </div>
                    ) : purchases.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            No purchases found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border/50 bg-muted/20">
                                        <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                                            Customer
                                        </th>
                                        <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                                            Items
                                        </th>
                                        <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                                            Method
                                        </th>
                                        <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                                            Amount
                                        </th>
                                        <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                                            Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {purchases.map((p) => {
                                        const items = Array.isArray(p.items) ? p.items : [];
                                        const itemNames = items
                                            .map((it: any) => it?.name ?? it?.title ?? "Item")
                                            .join(", ");
                                        return (
                                            <tr
                                                key={p.id}
                                                className="hover:bg-secondary/5 transition-colors"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar
                                                            name={p.full_name}
                                                            url={p.avatar_url}
                                                        />
                                                        <span className="font-medium truncate max-w-[120px]">
                                                            {p.full_name ?? "Anonymous"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground truncate max-w-[160px]">
                                                    {itemNames || `${items.length} item(s)`}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className="text-xs">
                                                        {p.payment_method}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold tabular-nums">
                                                    {formatMoney(Number(p.amount), p.currency ?? "USD")}
                                                </td>
                                                <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">
                                                    {formatDistanceToNow(new Date(p.created_at), {
                                                        addSuffix: true,
                                                    })}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

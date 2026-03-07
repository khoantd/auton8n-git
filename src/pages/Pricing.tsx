
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Check } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { fetchSubscriptionsEnabled } from "@/utils/systemSettings";

const Pricing = () => {
    const { addToCart } = useCart();
    const [subscriptionsEnabled, setSubscriptionsEnabled] = useState<boolean | null>(null);

    const handleAddPlan = (name: string, price: number, interval: string = "month", description: string) => {
        addToCart({
            id: name.toLowerCase().replace(" ", "-"),
            name: `${name} Plan`,
            price,
            interval,
            description,
        });
    };

    useEffect(() => {
        let isMounted = true;

        const loadSetting = async () => {
            const enabled = await fetchSubscriptionsEnabled();
            if (!isMounted) return;
            setSubscriptionsEnabled(enabled);
        };

        loadSetting().catch((error) => {
            console.error("Error loading subscriptions_enabled setting on Pricing page:", error);
            if (!isMounted) return;
            setSubscriptionsEnabled(true);
        });

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="min-h-screen bg-background font-sans antialiased">
            <Header />
            <main className="container mx-auto px-4 py-16">
                <div className="text-center space-y-4 mb-12">
                    <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-foreground">
                        Simple Pricing
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        Choose the plan that fits your needs. No hidden fees.
                    </p>
                </div>

                {subscriptionsEnabled === null ? (
                    <div className="flex items-center justify-center py-16 text-muted-foreground">
                        Loading pricing...
                    </div>
                ) : !subscriptionsEnabled ? (
                    <div className="max-w-xl mx-auto">
                        <div className="border rounded-xl p-8 bg-card text-center space-y-4">
                            <h2 className="text-2xl font-semibold">Subscriptions are currently unavailable</h2>
                            <p className="text-muted-foreground">
                                You can still browse and purchase individual workflows from the gallery.
                            </p>
                            <Button asChild>
                                <Link to="/">Back to Gallery</Link>
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        {/* Free Plan */}
                        <div className="border rounded-xl p-8 bg-card flex flex-col">
                            <h3 className="text-2xl font-semibold mb-2">Free</h3>
                            <div className="mb-6">
                                <span className="text-4xl font-bold">$0</span>
                                <span className="text-muted-foreground">/month</span>
                            </div>
                            <p className="text-muted-foreground mb-6">Perfect for getting started.</p>
                            <Button
                                variant="outline"
                                className="w-full mb-8"
                                onClick={() => handleAddPlan("Free", 0, "month", "Perfect for getting started.")}
                            >
                                Add to Cart
                            </Button>
                            <ul className="space-y-3 mb-8 flex-1">
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span>Up to 3 workflows</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span>Basic analytics</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span>Community support</span>
                                </li>
                            </ul>
                        </div>

                        {/* Pro Plan */}
                        <div className="border-2 border-primary rounded-xl p-8 bg-card flex flex-col relative shadow-lg">
                            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                                POPULAR
                            </div>
                            <h3 className="text-2xl font-semibold mb-2">Pro</h3>
                            <div className="mb-6">
                                <span className="text-4xl font-bold">$29</span>
                                <span className="text-muted-foreground">/month</span>
                            </div>
                            <p className="text-muted-foreground mb-6">For growing teams and businesses.</p>
                            <Button
                                className="w-full mb-8"
                                onClick={() => handleAddPlan("Pro", 29, "month", "For growing teams and businesses.")}
                            >
                                Add to Cart
                            </Button>
                            <ul className="space-y-3 mb-8 flex-1">
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span>Unlimited workflows</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span>Advanced analytics</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span>Priority support</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span>Team collaboration</span>
                                </li>
                            </ul>
                        </div>

                        {/* Enterprise Plan */}
                        <div className="border rounded-xl p-8 bg-card flex flex-col">
                            <h3 className="text-2xl font-semibold mb-2">Enterprise</h3>
                            <div className="mb-6">
                                <span className="text-4xl font-bold">Custom</span>
                            </div>
                            <p className="text-muted-foreground mb-6">For large organizations with specific needs.</p>
                            <Button asChild variant="outline" className="w-full mb-8">
                                <Link to="/contact">Contact Sales</Link>
                            </Button>
                            <ul className="space-y-3 mb-8 flex-1">
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span>Custom integrations</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span>Dedicated account manager</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span>SLA & uptime guarantees</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span>SSO & advanced security</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default Pricing;

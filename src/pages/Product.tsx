
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const Product = () => {
    return (
        <div className="min-h-screen bg-background font-sans antialiased">
            <Header />
            <main className="container mx-auto px-4 py-16">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-foreground">
                        Product Features
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        Discover the powerful features that make our workflow canvas the best tool for your needs.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 text-left">
                        <div className="p-6 border rounded-lg bg-card">
                            <h3 className="text-2xl font-semibold mb-2">Visual Workflow Editor</h3>
                            <p className="text-muted-foreground">
                                Drag and drop components to build complex workflows with ease. Visualize your processes like never before.
                            </p>
                        </div>
                        <div className="p-6 border rounded-lg bg-card">
                            <h3 className="text-2xl font-semibold mb-2">Real-time Collaboration</h3>
                            <p className="text-muted-foreground">
                                Work together with your team in real-time. See changes as they happen and communicate effectively.
                            </p>
                        </div>
                        <div className="p-6 border rounded-lg bg-card">
                            <h3 className="text-2xl font-semibold mb-2">Advanced Analytics</h3>
                            <p className="text-muted-foreground">
                                Gain insights into your workflow performance with detailed analytics and reporting tools.
                            </p>
                        </div>
                        <div className="p-6 border rounded-lg bg-card">
                            <h3 className="text-2xl font-semibold mb-2">Seamless Integrations</h3>
                            <p className="text-muted-foreground">
                                Connect with your favorite tools and services to streamline your operations.
                            </p>
                        </div>
                    </div>
                    <div className="pt-8">
                        <Button asChild size="lg">
                            <Link to="/auth?mode=signup">Get Started</Link>
                        </Button>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Product;

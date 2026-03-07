
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowRight } from "lucide-react";

const UseCases = () => {
    const cases = [
        {
            title: "Marketing Automation",
            description: "Automate your email campaigns, social media posting, and lead nurturing workflows.",
            icon: "🚀"
        },
        {
            title: "Data Processing",
            description: "Build robust data pipelines to extract, transform, and load data from various sources.",
            icon: "📊"
        },
        {
            title: "Customer Support",
            description: "Streamline ticket routing, auto-responses, and customer feedback loops.",
            icon: "🎧"
        },
        {
            title: "Software Development",
            description: "Orchestrate CI/CD pipelines, automated testing, and deployment processes.",
            icon: "💻"
        }
    ];

    return (
        <div className="min-h-screen bg-background font-sans antialiased">
            <Header />
            <main className="container mx-auto px-4 py-16">
                <div className="max-w-4xl mx-auto text-center space-y-8 mb-16">
                    <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-foreground">
                        Built for any workflow
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        See how teams across different industries use Workflow Canvas to save time and boost productivity.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {cases.map((useCase, index) => (
                        <div key={index} className="flex gap-6 p-6 border rounded-xl hover:shadow-md transition-shadow bg-card">
                            <div className="text-4xl">{useCase.icon}</div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2">{useCase.title}</h3>
                                <p className="text-muted-foreground mb-4">{useCase.description}</p>
                                <Button variant="link" className="p-0 h-auto gap-1 text-primary">
                                    Learn more <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-20 text-center">
                    <h2 className="text-2xl font-bold mb-4">Have a unique use case?</h2>
                    <Button asChild size="lg">
                        <Link to="/contact">Talk to us</Link>
                    </Button>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default UseCases;

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";


const Documents = () => {
    return (
        <div className="min-h-screen bg-background font-sans antialiased">
            <Header />

            {/* Hero Section */}
            <section className="relative pt-32 pb-12 overflow-hidden border-b">
                <div className="absolute inset-0 hero-gradient opacity-50" />
                <div className="container relative mx-auto px-4">
                    <div className="max-w-4xl">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Documentation</h1>
                        <p className="text-xl text-muted-foreground">
                            Learn how to build, deploy, and manage your workflows with Workflow Canvas.
                        </p>
                    </div>
                </div>
            </section>

            <main className="container mx-auto px-4 py-12 flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <aside className="w-full md:w-64 shrink-0">
                    <div className="sticky top-24">
                        <h4 className="font-semibold mb-4 text-foreground">Getting Started</h4>
                        <nav className="space-y-2 text-sm">
                            <a href="#" className="block hover:text-primary transition-colors text-primary font-medium">Overview</a>
                            <a href="#" className="block hover:text-primary transition-colors text-muted-foreground">Installation</a>
                            <a href="#" className="block hover:text-primary transition-colors text-muted-foreground">Authentication</a>
                            <a href="#" className="block hover:text-primary transition-colors text-muted-foreground">Workflows</a>
                            <a href="#" className="block hover:text-primary transition-colors text-muted-foreground">Components</a>
                        </nav>
                        <h4 className="font-semibold mt-8 mb-4 text-foreground">API Reference</h4>
                        <nav className="space-y-2 text-sm">
                            <a href="#" className="block hover:text-primary transition-colors text-muted-foreground">Overview</a>
                            <a href="#" className="block hover:text-primary transition-colors text-muted-foreground">Endpoints</a>
                            <a href="#" className="block hover:text-primary transition-colors text-muted-foreground">Authentication</a>
                        </nav>
                    </div>
                </aside>

                {/* Content */}
                <div className="flex-1 max-w-3xl">
                    <div className="space-y-12">
                        <section id="getting-started">
                            <h2 className="text-3xl font-bold tracking-tight mb-4">Overview</h2>
                            <p className="text-lg text-muted-foreground mb-6">
                                Welcome to the Workflow Canvas documentation. Our platform provides a powerful visual editor and a robust engine to automate your business processes.
                            </p>
                            <div className="p-6 bg-muted/50 rounded-xl border border-border/50">
                                <p className="text-sm leading-relaxed">
                                    <strong className="text-foreground">Note:</strong> This documentation is currently under development. Detailed guides and API references will be added soon.
                                </p>
                            </div>
                        </section>

                        <section id="installation">
                            <h2 className="text-2xl font-semibold mb-4">Installation</h2>
                            <p className="text-muted-foreground mb-4">
                                To get started with Workflow Canvas, you can install the SDK via npm or yarn.
                            </p>
                            <div className="relative group">
                                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm border border-border/50">
                                    <code className="text-primary">npm install @workflow-canvas/sdk</code>
                                </pre>
                            </div>
                        </section>

                        <section id="concepts">
                            <h2 className="text-2xl font-semibold mb-4">Core Concepts</h2>
                            <p className="text-muted-foreground mb-6">
                                Understand the building blocks of Workflow Canvas to maximize your automation potential.
                            </p>
                            <div className="grid gap-4">
                                {[
                                    { title: "Nodes", desc: "The individual steps in a workflow, performing specific actions." },
                                    { title: "Edges", desc: "The connections between nodes that define the logical path." },
                                    { title: "Triggers", desc: "Events that start a workflow execution automatically." }
                                ].map((item) => (
                                    <div key={item.title} className="p-4 rounded-lg border border-border/50 bg-card/50">
                                        <h4 className="font-medium mb-1">{item.title}</h4>
                                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};


export default Documents;

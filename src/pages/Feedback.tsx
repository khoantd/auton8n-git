import { useState, FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { MessageSquare } from "lucide-react";
import { apiUrl } from "@/lib/api";

export default function Feedback() {
    const { user } = useAuth();
    const { toast } = useToast();

    const [email, setEmail] = useState(user?.email ?? "");
    const [name, setName] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setSubmitting(true);

        try {
            const res = await fetch(apiUrl("/api/feedback"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    message,
                    name: name || undefined,
                    subject: subject || undefined,
                    userId: user?.id,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error ?? "Submission failed.");
            }

            setSubmitted(true);
            toast({ title: "Feedback sent", description: "Thank you! We'll be in touch if needed." });
        } catch (err: any) {
            toast({ variant: "destructive", title: "Error", description: err.message });
        } finally {
            setSubmitting(false);
        }
    }

    function handleReset() {
        setEmail(user?.email ?? "");
        setName("");
        setSubject("");
        setMessage("");
        setSubmitted(false);
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="container mx-auto px-4 pt-24 pb-12">
                <div className="max-w-lg mx-auto space-y-8">
                    <div className="text-center space-y-2">
                        <div className="flex justify-center mb-4">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <MessageSquare className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold">Feedback</h1>
                        <p className="text-muted-foreground">We'd love to hear from you. Send us a message and we'll respond if needed.</p>
                    </div>

                    <Card className="border-border/50 shadow-sm">
                        <CardHeader>
                            <CardTitle>Send feedback</CardTitle>
                            <CardDescription>All fields marked * are required.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {submitted ? (
                                <div className="py-8 text-center space-y-4">
                                    <p className="text-lg font-medium">Thank you for your feedback!</p>
                                    <p className="text-muted-foreground text-sm">A confirmation has been sent to <span className="font-medium">{email}</span>.</p>
                                    <Button variant="outline" onClick={handleReset}>Send another message</Button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            disabled={submitting}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name</Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Your name"
                                            disabled={submitting}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="subject">Subject</Label>
                                        <Input
                                            id="subject"
                                            type="text"
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            placeholder="What's this about?"
                                            disabled={submitting}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="message">Message *</Label>
                                        <Textarea
                                            id="message"
                                            required
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="Tell us what's on your mind…"
                                            rows={5}
                                            disabled={submitting}
                                        />
                                    </div>

                                    <Button type="submit" className="w-full font-semibold" disabled={submitting}>
                                        {submitting ? (
                                            <span className="flex items-center gap-2">
                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                Sending…
                                            </span>
                                        ) : "Send feedback"}
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            <Footer />
        </div>
    );
}

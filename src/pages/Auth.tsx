import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { signInSchema, signUpSchema } from "@/schemas/auth";

const AUTH_ERROR_FALLBACK = "Something went wrong. Please try again.";

/** User-friendly message for Supabase AuthRetryableFetchError (network/config). */
const AUTH_RETRYABLE_MESSAGE =
    "We couldn't reach the authentication service. Check your connection and try again. If the problem persists, the app may be misconfigured (e.g. missing Supabase env on deployment).";

/** Extract message from Supabase/auth or network errors (various shapes). */
function getAuthErrorMessage(err: unknown): string {
    if (err == null) return AUTH_ERROR_FALLBACK;
    const o = err as { name?: string; message?: string; error_description?: string; msg?: string };
    if (o.name === "AuthRetryableFetchError") return AUTH_RETRYABLE_MESSAGE;
    const msg = o.message ?? o.error_description ?? o.msg;
    if (typeof msg === "string" && msg.trim()) return msg.trim();
    if (typeof err === "string") return err.trim() || AUTH_ERROR_FALLBACK;
    return AUTH_ERROR_FALLBACK;
}

/** Sanitize auth error messages so template placeholders like {0} are never shown to users. */
function sanitizeAuthErrorMessage(message: string | undefined): string {
    if (message == null || typeof message !== "string") return AUTH_ERROR_FALLBACK;
    const trimmed = message.trim();
    let out = trimmed
        .replace(/\{\{\s*\.\w+\s*\}\}/g, "")
        .replace(/\{\d+\}/g, "")
        .replace(/\s+/g, " ")
        .trim();
    if (!out || /^[\s\{\}\.\d]+$/.test(out)) return AUTH_ERROR_FALLBACK;
    return out;
}

const Auth = () => {
    const [searchParams] = useSearchParams();
    const [isSignUp, setIsSignUp] = useState(() => searchParams.get("mode") === "signup");
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const isSignUpRef = useRef(isSignUp);
    const navigate = useNavigate();
    const location = useLocation();
    const { session, initialized } = useAuth();
    const { toast } = useToast();

    const from = location.state?.from?.pathname || "/";

    useEffect(() => {
        if (initialized && session) {
            console.log("User is already authenticated, redirecting to:", from);
            navigate(from, { replace: true });
        }
    }, [session, initialized, navigate, from]);

    const form = useForm({
        resolver: async (data, context, options) => {
            const schema = isSignUpRef.current ? signUpSchema : signInSchema;
            return zodResolver(schema)(data, context, options);
        },
        defaultValues: { email: "", password: "", fullName: "", username: "" },
    });

    const handleModeSwitch = () => {
        const currentEmail = form.getValues("email");
        const newIsSignUp = !isSignUp;
        isSignUpRef.current = newIsSignUp;
        setIsSignUp(newIsSignUp);
        setServerError(null);
        form.reset({ email: currentEmail, password: "", fullName: "", username: "" });
    };

    const handleAuth = async (values: { email: string; password: string; fullName: string; username: string }) => {
        setLoading(true);
        setServerError(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email: values.email,
                    password: values.password,
                    options: {
                        data: {
                            full_name: values.fullName,
                            username: values.username,
                        },
                    },
                });
                if (error) throw error;

                toast({
                    title: "Success!",
                    description: "Check your email for the confirmation link!",
                });
                setServerError("Check your email for the confirmation link!");
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email: values.email,
                    password: values.password,
                });
                if (error) throw error;

                toast({
                    title: "Welcome back",
                    description: "Successfully signed in.",
                });
            }
        } catch (err: unknown) {
            console.error("Auth error:", err);
            const rawMessage = getAuthErrorMessage(err);
            const safeMessage = sanitizeAuthErrorMessage(rawMessage);
            setServerError(safeMessage);
            toast({
                variant: "destructive",
                title: "Authentication Error",
                description: safeMessage,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">
                        {isSignUp ? "Create an Account" : "Welcome Back"}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {isSignUp
                            ? "Enter your details to create your account"
                            : "Enter your email below to login to your account"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleAuth)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="name@example.com"
                                                disabled={loading}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {isSignUp && (
                                <>
                                    <FormField
                                        control={form.control}
                                        name="fullName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Full Name</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="text"
                                                        placeholder="John Doe"
                                                        disabled={loading}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="username"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Username</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="text"
                                                        placeholder="johndoe"
                                                        disabled={loading}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </>
                            )}
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                disabled={loading}
                                                {...field}
                                            />
                                        </FormControl>
                                        {isSignUp && (
                                            <FormDescription>At least 6 characters.</FormDescription>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {serverError && (
                                <Alert
                                    variant={serverError.includes("Check your email") ? "default" : "destructive"}
                                    className="animate-in fade-in slide-in-from-top-1 border-l-4"
                                    role="alert"
                                >
                                    <AlertDescription className="text-sm">{serverError}</AlertDescription>
                                </Alert>
                            )}
                            <Button type="submit" className="w-full font-semibold" disabled={loading}>
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                                        Processing...
                                    </span>
                                ) : (
                                    isSignUp ? "Sign Up" : "Sign In"
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2 text-center">
                    <Button
                        variant="link"
                        onClick={handleModeSwitch}
                        className="text-sm text-muted-foreground"
                        disabled={loading}
                    >
                        {isSignUp
                            ? "Already have an account? Sign In"
                            : "Don't have an account? Sign Up"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Auth;

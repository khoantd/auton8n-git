import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export const ProtectedRoute = ({
    children,
    requiredRole
}: {
    children: ReactNode;
    requiredRole?: string;
}) => {
    const { session, role, loading, initialized } = useAuth();
    const location = useLocation();

    // Show loading while initializing OR while an explicit loading state is active
    if (!initialized || loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background text-foreground font-sans">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-muted-foreground animate-pulse font-sans">Checking authentication...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        console.log("No session found, redirecting to /auth from", location.pathname);
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    // Role-based protection: if a role is required but hasn't been loaded yet, keep loading
    if (requiredRole && role === null) {
        return (
            <div className="flex h-screen items-center justify-center bg-background text-foreground font-sans">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-muted-foreground animate-pulse font-sans">Verifying permissions...</p>
                </div>
            </div>
        );
    }

    if (requiredRole && role !== requiredRole) {
        console.warn(`Access denied: User role "${role}" does not match required role "${requiredRole}"`);
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-300">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 text-destructive mb-2">
                            <ShieldAlert size={40} />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
                            <p className="text-muted-foreground text-lg">
                                You don't have the required permissions to access the admin area.
                            </p>
                        </div>
                        <div className="pt-4">
                            <Button asChild variant="default" size="lg" className="gap-2">
                                <Link to="/">
                                    <ArrowLeft size={18} />
                                    Back to Home
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return <>{children}</>;
};

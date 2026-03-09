
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Session = { user: User } | null;
type User = { id: string; email?: string | null };

type AuthContextType = {
    session: Session | null;
    user: User | null;
    role: string | null;
    loading: boolean;
    initialized: boolean;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    role: null,
    loading: true,
    initialized: false,
    signOut: async () => { },
});

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [initialized, setInitialized] = useState(false);

    const fetchUserRole = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", userId)
                .single();

            if (error) {
                console.error("Error fetching user role:", error);
                setRole(null);
            } else {
                setRole(data?.role || "user");
            }
        } catch (error) {
            console.error("Error in fetchUserRole:", error);
            setRole(null);
        }
    };

    useEffect(() => {
        let isMounted = true;

        // Get initial session
        const getInitialSession = async () => {
            try {
                const { data: { session: initialSession } } = await supabase.auth.getSession();

                if (isMounted) {
                    setSession(initialSession);
                    setUser(initialSession?.user ?? null);

                    if (initialSession?.user) {
                        // Fetch role but don't block the initial "initialized" state update if it takes too long
                        fetchUserRole(initialSession.user.id);
                    } else {
                        setRole(null);
                    }
                }
            } catch (error) {
                console.error("Error getting initial session:", error);
            } finally {
                if (isMounted) {
                    setInitialized(true);
                    setLoading(false);
                }
            }
        };

        getInitialSession();

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            if (!isMounted) return;

            console.log("Auth event:", event, currentSession?.user?.id);

            setSession(currentSession);
            setUser(currentSession?.user ?? null);

            if (currentSession?.user) {
                // Fetch the user role, but don't let it block the basic auth initialization
                fetchUserRole(currentSession.user.id);
            } else {
                setRole(null);
            }

            // Always ensure these are set after an auth event to prevent hanging
            setLoading(false);
            setInitialized(true);
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ session, user, role, loading, initialized, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

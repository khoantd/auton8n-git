import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

interface SubscriptionContextType {
    plan: string;
    isPro: boolean;
    ownedWorkflowIds: string[];
    loading: boolean;
    refreshSubscription: () => Promise<void>;
    addPurchasedWorkflowIds: (ids: string[]) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [plan, setPlan] = useState<string>("free");
    const [ownedWorkflowIds, setOwnedWorkflowIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSubscriptionData = useCallback(async () => {
        if (!user) {
            setPlan("free");
            setOwnedWorkflowIds([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Fetch subscription
            const { data: subData, error: subError } = await supabase
                .from("subscriptions")
                .select("plan_type, status")
                .eq("user_id", user.id)
                .order("updated_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (subError) throw subError;

            if (subData && subData.status === "active") {
                setPlan(subData.plan_type);
            } else {
                setPlan("free");
            }

            // Fetch purchased workflows
            const { data: wfData, error: wfError } = await supabase
                .from("purchased_workflows")
                .select("workflow_id")
                .eq("user_id", user.id);

            if (wfError) throw wfError;

            setOwnedWorkflowIds(wfData?.map(item => item.workflow_id) || []);

        } catch (error) {
            console.error("Error fetching subscription data:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchSubscriptionData();
    }, [fetchSubscriptionData]);

    const isPro = plan === "pro" || plan === "enterprise";

    const addPurchasedWorkflowIds = useCallback((ids: string[]) => {
        setOwnedWorkflowIds(prev => [...new Set([...prev, ...ids])]);
    }, []);

    return (
        <SubscriptionContext.Provider
            value={{
                plan,
                isPro,
                ownedWorkflowIds,
                loading,
                refreshSubscription: fetchSubscriptionData,
                addPurchasedWorkflowIds,
            }}
        >
            {children}
        </SubscriptionContext.Provider>
    );
};

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error("useSubscription must be used within a SubscriptionProvider");
    }
    return context;
};

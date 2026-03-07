import { supabase } from "@/integrations/supabase/client";

export type ActivityAction =
    | "create_workflow"
    | "update_workflow"
    | "delete_workflow"
    | "create_document"
    | "update_document"
    | "delete_document"
    | "update_profile"
    | "purchase_workflow"
    | "subscribe";

export interface LogActivityParams {
    userId: string;
    action: ActivityAction;
    entityType?: string;
    entityId?: string;
    description: string;
    metadata?: any;
}

export const logActivity = async ({
    userId,
    action,
    entityType,
    entityId,
    description,
    metadata
}: LogActivityParams) => {
    try {
        const { error } = await supabase.from("activity_logs").insert([
            {
                user_id: userId,
                action,
                entity_type: entityType,
                entity_id: entityId,
                description,
                metadata,
            },
        ]);

        if (error) {
            console.error("Error logging activity:", error);
        }
    } catch (err) {
        console.error("Unexpected error logging activity:", err);
    }
};

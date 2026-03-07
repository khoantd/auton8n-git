import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch whether subscriptions are globally enabled.
 * Falls back to true on error or missing setting so we don't accidentally block sales.
 */
export const fetchSubscriptionsEnabled = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "subscriptions_enabled")
      .maybeSingle();

    if (error) {
      console.error("Error fetching subscriptions_enabled setting:", error);
      return true;
    }

    const rawValue = (data as { value: unknown } | null)?.value;

    if (typeof rawValue === "boolean") {
      return rawValue;
    }

    if (typeof rawValue === "string") {
      const normalized = rawValue.toLowerCase();
      if (normalized === "true") return true;
      if (normalized === "false") return false;
    }

    if (rawValue && typeof rawValue === "object" && "enabled" in (rawValue as any)) {
      const enabled = (rawValue as any).enabled;
      if (typeof enabled === "boolean") {
        return enabled;
      }
    }

    // Default: enabled
    return true;
  } catch (error) {
    console.error("Unexpected error fetching subscriptions_enabled setting:", error);
    return true;
  }
};


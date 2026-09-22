import { createClient } from "@/lib/supabase/server";
import { NO_DELIVERY, type DeliverySettings } from "@/lib/delivery";

// Store-wide settings live in one row, created by supabase/add-delivery.sql.
// Before that file is run the table does not exist, and the store simply
// charges no delivery instead of failing.
export async function getDeliverySettings(): Promise<DeliverySettings> {
  const supabase = createClient();
  const { data } = await supabase
    .from("settings")
    .select("default_delivery_fee")
    .limit(1)
    .maybeSingle();

  const fee = Number(data?.default_delivery_fee);
  return Number.isFinite(fee) && fee > 0 ? { defaultFee: fee } : NO_DELIVERY;
}

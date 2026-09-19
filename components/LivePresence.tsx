"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { getDevice, getVisitorId } from "@/lib/track";

export const LIVE_CHANNEL = "store-live";

// Tells the admin "Live now" page which store page this visitor has open.
// Uses Supabase Realtime Presence: nothing is written to the database and the
// visitor drops off the list a few seconds after closing the tab.
export default function LivePresence() {
  const pathname = usePathname() || "/";
  const onStore = !pathname.startsWith("/admin");
  const channelRef = useRef<RealtimeChannel | null>(null);
  const joinedRef = useRef(false);
  const pathRef = useRef(pathname);
  const sessionSince = useRef(Date.now());
  pathRef.current = pathname;

  useEffect(() => {
    if (!onStore) return;
    const supabase = createClient();
    const channel = supabase.channel(LIVE_CHANNEL, {
      config: { presence: { key: getVisitorId() } },
    });
    channelRef.current = channel;
    channel.subscribe((status) => {
      if (status !== "SUBSCRIBED") return;
      joinedRef.current = true;
      channel.track({
        path: pathRef.current,
        device: getDevice(),
        pageSince: Date.now(),
        sessionSince: sessionSince.current,
      });
    });
    return () => {
      joinedRef.current = false;
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [onStore]);

  useEffect(() => {
    if (!onStore || !joinedRef.current || !channelRef.current) return;
    channelRef.current.track({
      path: pathname,
      device: getDevice(),
      pageSince: Date.now(),
      sessionSince: sessionSince.current,
    });
  }, [pathname, onStore]);

  return null;
}

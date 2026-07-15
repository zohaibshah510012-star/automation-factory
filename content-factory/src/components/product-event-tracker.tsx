"use client";

import Link from "next/link";
import { useEffect } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { ProductEventName } from "@/lib/product-analytics";

function getAnonymousId() {
  const key = "automation_factory_anonymous_id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const next = crypto.randomUUID();
  window.localStorage.setItem(key, next);
  return next;
}

export async function trackProductEvent(
  eventName: ProductEventName,
  properties: Record<string, unknown> = {},
  surface = "web",
) {
  const session = await getSupabaseBrowserClient()?.auth.getSession();
  await fetch("/api/analytics/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session?.data.session?.access_token ?? ""}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      eventName,
      anonymousId: getAnonymousId(),
      surface,
      path: window.location.pathname,
      referrer: document.referrer || null,
      properties,
    }),
  }).catch(() => undefined);
}

export function TrackPageView({
  eventName = "page_view",
  surface,
  properties,
}: {
  eventName?: ProductEventName;
  surface: string;
  properties?: Record<string, unknown>;
}) {
  const propertiesKey = JSON.stringify(properties ?? {});

  useEffect(() => {
    void trackProductEvent(eventName, JSON.parse(propertiesKey) as Record<string, unknown>, surface);
  }, [eventName, propertiesKey, surface]);

  return null;
}

export function TrackClicks({ surface }: { surface: string }) {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>("[data-analytics-event]")
        : null;
      if (!target) return;
      const eventName = target.dataset.analyticsEvent as ProductEventName;
      if (!eventName) return;
      const label = target.dataset.analyticsLabel;
      const href = target instanceof HTMLAnchorElement ? target.href : target.getAttribute("href");
      void trackProductEvent(eventName, { label, href }, surface);
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [surface]);

  return null;
}

export function TrackedLink({
  href,
  children,
  className,
  eventName = "cta_click",
  surface,
  properties,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  eventName?: ProductEventName;
  surface: string;
  properties?: Record<string, unknown>;
}) {
  return (
    <Link
      className={className}
      href={href}
      onClick={() => void trackProductEvent(eventName, { href, ...properties }, surface)}
    >
      {children}
    </Link>
  );
}

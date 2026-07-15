"use client";

import Link from "next/link";
import { ArrowRightIcon, SparklesIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { navigationItems } from "@/components/landing/landing-data";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function updateScrolled() {
      setScrolled(window.scrollY > 12);
    }

    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });
    return () => window.removeEventListener("scroll", updateScrolled);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 border-b border-white/10 transition-all duration-300",
        scrolled
          ? "bg-[#070914]/85 shadow-2xl shadow-black/30 backdrop-blur-2xl"
          : "bg-[#050712]/45 backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link className="flex items-center gap-3" href="/">
          <span className="grid size-9 place-items-center rounded-2xl bg-white text-[#050712] shadow-lg shadow-cyan-500/20">
            <SparklesIcon />
          </span>
          <span className="text-sm font-semibold tracking-[0.2em] text-white uppercase">
            Automation Factory
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-white/68 lg:flex">
          {navigationItems.map((item) => (
            <Link className="transition hover:text-white" href={item.href} key={item.label}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button
            className="hidden border-white/15 bg-white/5 text-white hover:bg-white/10 sm:inline-flex"
            render={<Link href="/dashboard/studio" />}
            variant="outline"
          >
            Login
          </Button>
          <Button
            className="bg-white text-[#050712] hover:bg-cyan-100"
            data-analytics-event="cta_click"
            data-analytics-label="header_start_creating"
            render={<Link href="/dashboard/studio" />}
          >
            Start Creating
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </header>
  );
}

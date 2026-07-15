import Link from "next/link";
import { ArrowRightIcon, PlayIcon } from "lucide-react";

import { showcaseItems } from "@/components/landing/landing-data";
import { Button } from "@/components/ui/button";

export function ShowcaseSection() {
  return (
    <section className="px-5 py-20 lg:px-8" id="showcase">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium tracking-[0.24em] text-fuchsia-200 uppercase">Showcase</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] md:text-6xl">
              像 AI Gallery 一样展示作品
            </h2>
          </div>
          <Button
            className="w-fit rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
            data-analytics-event="cta_click"
            data-analytics-label="showcase_view_all"
            render={<Link href="/showcase" />}
            variant="outline"
          >
            View all demos
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {showcaseItems.map((item) => (
            <article
              className="group overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.06] shadow-2xl shadow-black/20"
              key={item.title}
            >
              <div className={`relative aspect-[4/5] bg-gradient-to-br ${item.gradient}`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.34),transparent_30%)]" />
                <div className="absolute inset-x-5 bottom-5 rounded-3xl border border-white/18 bg-black/28 p-5 backdrop-blur-xl">
                  <p className="text-sm text-white/68">{item.category}</p>
                  <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{item.title}</h3>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 p-5">
                <div>
                  <p className="text-sm text-white/45">{item.duration}</p>
                  <p className="mt-1 text-sm text-cyan-200">{item.status}</p>
                </div>
                <Link
                  className="grid size-11 place-items-center rounded-full bg-white text-[#050712] transition group-hover:scale-105"
                  href="/showcase"
                >
                  <PlayIcon />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

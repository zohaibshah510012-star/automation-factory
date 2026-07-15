import Link from "next/link";
import { ArrowRightIcon, SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="px-5 pb-10 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] border border-white/12 bg-[radial-gradient(circle_at_25%_20%,rgba(34,211,238,0.34),transparent_30%),radial-gradient(circle_at_70%_30%,rgba(217,70,239,0.26),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.05))] p-8 shadow-2xl shadow-black/40 md:p-14">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-7 text-center">
          <span className="grid size-14 place-items-center rounded-3xl bg-white text-[#050712]">
            <SparklesIcon />
          </span>
          <div>
            <h2 className="text-4xl font-semibold tracking-[-0.05em] text-balance md:text-6xl">
              开始创建你的第一个 AI 短剧
            </h2>
            <p className="mt-5 text-lg leading-8 text-white/68">
              从一个主题开始，把剧本、角色、分镜、图片、视频和发布任务变成可管理的内容资产。
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              className="h-12 rounded-full bg-white px-6 text-[#050712] hover:bg-cyan-100"
              data-analytics-event="cta_click"
              data-analytics-label="final_start_free"
              render={<Link href="/dashboard/studio" />}
              size="lg"
            >
              Start Free
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
            <Button
              className="h-12 rounded-full border-white/15 bg-white/5 px-6 text-white hover:bg-white/10"
              render={<Link href="/showcase" />}
              size="lg"
              variant="outline"
            >
              View Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

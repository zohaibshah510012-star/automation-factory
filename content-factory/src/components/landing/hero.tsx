import Link from "next/link";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  PlayCircleIcon,
  SparklesIcon,
} from "lucide-react";

import { pipelineSteps } from "@/components/landing/landing-data";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative px-5 pt-32 pb-20 lg:px-8 lg:pt-40 lg:pb-28">
      <div className="absolute inset-0 -z-10">
        <div className="landing-float absolute top-[-10rem] left-[22%] size-[38rem] rounded-full bg-cyan-500/25 blur-3xl" />
        <div className="landing-float-delayed absolute right-[-12rem] bottom-[-12rem] size-[36rem] rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_36%),linear-gradient(180deg,rgba(5,7,18,0)_0%,#050712_88%)]" />
      </div>

      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <div className="flex flex-col gap-8">
          <div className="flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm text-cyan-100 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
            <SparklesIcon />
            Premium AI SaaS for short drama production
          </div>

          <div className="flex flex-col gap-6">
            <h1 className="max-w-5xl text-5xl leading-[0.96] font-semibold tracking-[-0.06em] text-balance md:text-7xl lg:text-8xl">
              一个创意，自动生成完整 AI 短剧内容资产
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-white/68 md:text-xl">
              Turn one idea into a complete AI drama production. AI Agent 自动完成剧本、角色、分镜、图片、视频和多平台发布任务。
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              className="h-12 rounded-full bg-white px-6 text-[#050712] shadow-2xl shadow-cyan-500/20 hover:bg-cyan-100"
              data-analytics-event="cta_click"
              data-analytics-label="hero_free_drama"
              render={<Link href="/dashboard/studio" />}
              size="lg"
            >
              免费生成第一部短剧
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
            <Button
              className="h-12 rounded-full border-white/15 bg-white/5 px-6 text-white hover:bg-white/10"
              data-analytics-event="cta_click"
              data-analytics-label="hero_view_demo"
              render={<Link href="/showcase" />}
              size="lg"
              variant="outline"
            >
              <PlayCircleIcon data-icon="inline-start" />
              查看 Demo
            </Button>
          </div>

          <div className="grid gap-3 text-sm text-white/62 sm:grid-cols-3">
            {["短剧生产链路", "图片/视频任务", "分发与商业化"].map((item) => (
              <span className="flex items-center gap-2" key={item}>
                <CheckCircle2Icon className="text-cyan-300" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <PipelineCard />
      </div>
    </section>
  );
}

function PipelineCard() {
  return (
    <div className="relative">
      <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-fuchsia-500/20 blur-3xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.07] p-4 shadow-2xl shadow-black/40 backdrop-blur-2xl">
        <div className="rounded-[1.5rem] border border-white/10 bg-[#090d1b]/88 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-white/50">AI Production Pipeline</p>
              <h2 className="landing-shimmer mt-1 bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-2xl font-semibold tracking-tight text-transparent">
                Drama Studio Run #042
              </h2>
            </div>
            <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
              Live preview
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            {pipelineSteps.map((step, index) => (
              <div className="group flex items-center gap-3" key={step.label}>
                <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white/8 text-sm text-white/70 ring-1 ring-white/10 group-hover:bg-cyan-300 group-hover:text-[#050712]">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs tracking-[0.18em] text-white/35 uppercase">{step.label}</p>
                      <p className="mt-1 font-medium text-white">{step.value}</p>
                    </div>
                    <ChevronRightIcon className="text-white/35" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {["Script", "Images", "Video"].map((item) => (
              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.03] p-3" key={item}>
                <p className="text-xs text-white/40">{item}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-4/5 rounded-full bg-cyan-300" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

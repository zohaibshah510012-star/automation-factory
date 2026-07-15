import type { Metadata } from "next";

import { FinalCta } from "@/components/landing/final-cta";
import { LandingFaq } from "@/components/landing/faq";
import { FeaturesSection } from "@/components/landing/features";
import { HeroSection } from "@/components/landing/hero";
import { ProductDemoSection } from "@/components/landing/product-demo";
import { ShowcaseSection } from "@/components/landing/showcase";
import { SiteHeader } from "@/components/landing/site-header";
import { WorkflowSection } from "@/components/landing/workflow";
import { TrackClicks, TrackPageView } from "@/components/product-event-tracker";

export const metadata: Metadata = {
  title: "Automation Factory | AI 短剧内容生产平台",
  description:
    "一个创意，自动生成剧本、角色、分镜、图片、视频和多平台发布任务。面向短视频创作者、内容团队和营销团队的 Premium AI SaaS。",
  openGraph: {
    title: "Automation Factory | AI 短剧内容生产平台",
    description:
      "Turn one idea into a complete AI drama production: script, characters, scenes, images, video and publishing workflow.",
    type: "website",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Automation Factory | AI 短剧内容生产平台",
    description: "一个创意，自动生成完整 AI 短剧内容资产。",
  },
};

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050712] text-white">
      <TrackPageView surface="landing" properties={{ page: "home", version: "premium_v2" }} />
      <TrackClicks surface="landing" />
      <SiteHeader />
      <HeroSection />
      <ProductDemoSection />
      <ShowcaseSection />
      <WorkflowSection />
      <FeaturesSection />
      <LandingFaq />
      <FinalCta />
    </main>
  );
}

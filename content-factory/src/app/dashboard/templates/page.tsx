import Link from "next/link";
import {
  ArrowRightIcon,
  ClapperboardIcon,
  FileTextIcon,
  FilmIcon,
  ImageIcon,
  SparklesIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const templates = [
  {
    icon: ClapperboardIcon,
    title: "短剧生成",
    audience: "短视频创作者 / MCN / 品牌内容团队",
    description: "围绕一个主题生成剧情、角色、分镜，并推进图片与视频任务。",
    output: ["剧情简介", "角色设定", "结构化分镜", "图片/视频任务"],
    href: "/dashboard/studio?template=drama",
  },
  {
    icon: FileTextIcon,
    title: "内容生成",
    audience: "营销团队 / 社媒运营 / 电商团队",
    description: "生成口播脚本、社媒文案、营销卖点和内容资产。",
    output: ["标题", "脚本", "分镜建议", "可复用内容资产"],
    href: "/dashboard/studio?template=content",
  },
  {
    icon: ImageIcon,
    title: "图片生成",
    audience: "设计协作 / 内容包装 / 广告素材",
    description: "把场景描述、产品卖点或分镜转换成图片生成任务。",
    output: ["图片 Prompt", "生成状态", "结果预览", "重新生成入口"],
    href: "/dashboard/studio?template=image",
  },
  {
    icon: FilmIcon,
    title: "视频生成",
    audience: "短视频生产 / 广告片段 / Demo 展示",
    description: "把提示词或图片结果衔接到视频片段生成任务。",
    output: ["视频 Prompt", "任务状态", "播放器入口", "重新生成入口"],
    href: "/dashboard/videos",
  },
];

const demoAssets = [
  {
    label: "剧情结果",
    content: "三人内容团队遭遇断更危机，AI 工作流把产品卖点转为剧情冲突，最终形成可连续更新的短剧栏目。",
  },
  {
    label: "角色结果",
    content: "主理人、剪辑师、增长负责人三位角色，分别承担冲突、执行和商业结果。",
  },
  {
    label: "分镜结果",
    content: "开场痛点、方法拆解、自动生成、结果展示四段式短视频结构。",
  },
];

export default function TemplateGalleryPage() {
  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-8 p-6">
      <header className="grid gap-6 rounded-2xl bg-muted/50 p-6 md:grid-cols-[1fr_auto] md:items-end">
        <div className="flex flex-col gap-3">
          <Badge className="w-fit" variant="secondary">
            Product Templates
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight">AI 内容产品模板库</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            这里把已经上线的 AI 能力包装成用户能理解、能选择、能购买的产品入口。新用户可以先看 Demo，再进入对应工作台生成第一个作品。
          </p>
        </div>
        <Button render={<Link href="/dashboard/studio?template=drama" />}>
          从短剧模板开始
          <SparklesIcon data-icon="inline-end" />
        </Button>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {templates.map((template) => (
          <Card key={template.title}>
            <CardHeader>
              <span className="grid size-10 place-items-center rounded-xl bg-muted">
                <template.icon />
              </span>
              <CardTitle>{template.title}</CardTitle>
              <CardDescription>{template.audience}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <p className="text-sm leading-6 text-muted-foreground">{template.description}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {template.output.map((item) => (
                  <div className="rounded-lg border bg-background p-3 text-sm" key={item}>
                    {item}
                  </div>
                ))}
              </div>
              <Button render={<Link href={template.href} />} variant="outline">
                使用模板
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle>Demo 数据</CardTitle>
            <CardDescription>新用户无需等待生成，也能立即看到短剧生产结果结构。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {demoAssets.map((asset) => (
              <div className="rounded-xl border p-4" key={asset.label}>
                <p className="font-medium">{asset.label}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{asset.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>首次用户路径</CardTitle>
            <CardDescription>把复杂能力压缩成一个清晰购买体验。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {["选择模板", "输入主题", "免费生成第一个作品"].map((step, index) => (
                <div className="rounded-xl bg-muted p-4" key={step}>
                  <p className="text-xs text-muted-foreground">Step {index + 1}</p>
                  <p className="mt-2 font-medium">{step}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

import Link from "next/link";
import {
  ArrowRightIcon,
  ClapperboardIcon,
  FileTextIcon,
  ImageIcon,
  SparklesIcon,
  VideoIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrackClicks, TrackPageView } from "@/components/product-event-tracker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { capabilityLabels, workflowTemplates, type WorkflowCapability } from "@/lib/workflow-templates";

const icons: Record<WorkflowCapability, typeof SparklesIcon> = {
  drama: ClapperboardIcon,
  video: VideoIcon,
  image: ImageIcon,
  content: FileTextIcon,
};

export default function TemplateGalleryPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <TrackPageView eventName="template_view" surface="templates" properties={{ page: "workflow_template_gallery" }} />
      <TrackClicks surface="templates" />
      <section className="mx-auto flex max-w-7xl flex-col gap-8 p-6">
        <header className="grid gap-6 rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/20 md:grid-cols-[1fr_auto] md:items-end md:p-8">
          <div>
            <Badge className="border-white/15 bg-white/10 text-white hover:bg-white/15" variant="outline">
              工作流模板
            </Badge>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
              从一个可直接使用的创作模板开始。
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/65">
              每个模板都包含适用场景、示例输入和预计输出，新用户不需要猜怎么写提示词。
            </p>
          </div>
          <Button className="bg-white text-slate-950 hover:bg-white/90" data-analytics-event="template_select" data-analytics-label="template_gallery_start" render={<Link href="/create" />}>
            打开创作向导
            <SparklesIcon data-icon="inline-end" />
          </Button>
        </header>

        <section className="grid gap-3 md:grid-cols-4">
          {(["drama", "video", "image", "content"] as WorkflowCapability[]).map((capability) => {
            const Icon = icons[capability];
            return (
              <Card key={capability}>
                <CardHeader>
                  <span className="grid size-10 place-items-center rounded-xl bg-muted">
                    <Icon className="size-5" />
                  </span>
                  <CardTitle>{capabilityLabels[capability].title}</CardTitle>
                  <CardDescription>{capabilityLabels[capability].description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          {workflowTemplates.map((template) => {
            const Icon = icons[template.capability];
            return (
              <Card className="overflow-hidden bg-white/95 shadow-xl shadow-slate-950/5" key={template.id}>
                <CardHeader>
                  <div className={`grid size-12 place-items-center rounded-2xl bg-gradient-to-br ${template.accent} text-white`}>
                    <Icon className="size-5" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle>{template.title}</CardTitle>
                    <Badge variant="outline">{template.channel}</Badge>
                  </div>
                  <CardDescription>{template.commercialName}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  <p className="text-sm leading-6 text-muted-foreground">{template.description}</p>

                  <div className="grid gap-3">
                    <div className="rounded-2xl border bg-muted/40 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">示例输入</p>
                      <p className="mt-2 text-sm leading-6">{template.exampleInput}</p>
                    </div>
                    <div className="rounded-2xl border bg-background p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">预计输出</p>
                      <p className="mt-2 text-sm leading-6">{template.estimatedOutput}</p>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {template.outcome.map((item) => (
                      <div className="rounded-xl border bg-background p-3 text-sm" key={item}>
                        {item}
                      </div>
                    ))}
                  </div>

                  <Button data-analytics-event="template_select" data-analytics-label={template.id} render={<Link href={`/create?template=${template.id}`} />} variant="outline">
                    使用这个模板
                    <ArrowRightIcon data-icon="inline-end" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <Card className="bg-white/95 shadow-xl shadow-slate-950/5">
          <CardHeader>
            <CardTitle>首次使用路径</CardTitle>
            <CardDescription>产品目标是让新用户在 5 分钟内完成一次有价值的生成。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              {["选择模板", "输入需求", "启动 AI 工作流", "查看结果"].map((step, index) => (
                <div className="rounded-2xl bg-muted p-4" key={step}>
                  <p className="text-xs text-muted-foreground">步骤 {index + 1}</p>
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

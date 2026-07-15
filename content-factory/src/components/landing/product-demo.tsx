import { ImageIcon, PlayCircleIcon, WandSparklesIcon } from "lucide-react";

import { demoAssets, mockScenes } from "@/components/landing/landing-data";

export function ProductDemoSection() {
  return (
    <section className="relative px-5 py-20 lg:px-8" id="product">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium tracking-[0.24em] text-cyan-200 uppercase">Product Demo</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-balance md:text-6xl">
              从一句主题，到一套可展示的短剧资产
            </h2>
          </div>
          <p className="max-w-md text-base leading-7 text-white/58">
            用户输入“创业逆袭故事”，系统输出剧本卡、角色卡、分镜卡和视频预览，让产品价值在 3 秒内被理解。
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-white/12 bg-white/[0.06] p-5 backdrop-blur-xl">
            <div className="rounded-[1.5rem] bg-[#0b1020] p-5 ring-1 ring-white/10">
              <p className="text-sm text-white/45">User prompt</p>
              <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-5 text-xl font-medium">
                创业逆袭故事：一个内容团队用 AI 在 7 天内救回停滞账号
              </div>
              <button className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-medium text-[#050712]">
                <WandSparklesIcon />
                Generate production package
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              {mockScenes.map((scene, index) => (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4" key={scene}>
                  <p className="text-xs text-white/35">Scene {String(index + 1).padStart(2, "0")}</p>
                  <p className="mt-1 text-sm text-white/72">{scene}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5">
            <div className="grid gap-5 md:grid-cols-3">
              {demoAssets.map((asset) => (
                <article
                  className="group rounded-[1.75rem] border border-white/12 bg-white/[0.06] p-5 transition duration-300 hover:-translate-y-1 hover:bg-white/[0.09]"
                  key={asset.label}
                >
                  <div className={`mb-6 h-24 rounded-2xl bg-gradient-to-br ${asset.accent} opacity-90 shadow-2xl shadow-black/30`} />
                  <p className="text-xs tracking-[0.2em] text-white/35 uppercase">{asset.label}</p>
                  <h3 className="mt-2 text-xl font-semibold">{asset.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/58">{asset.description}</p>
                </article>
              ))}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="flex aspect-video items-center justify-center rounded-[1.75rem] border border-white/12 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.35),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03))] text-white/72">
                <ImageIcon className="mr-2" />
                Storyboard image preview
              </div>
              <div className="flex aspect-video items-center justify-center rounded-[1.75rem] border border-white/12 bg-[radial-gradient(circle_at_70%_30%,rgba(217,70,239,0.35),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03))] text-white/72">
                <PlayCircleIcon className="mr-2" />
                Video preview entrance
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

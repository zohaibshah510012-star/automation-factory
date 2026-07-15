import { workflowSteps } from "@/components/landing/landing-data";

export function WorkflowSection() {
  return (
    <section className="px-5 py-20 lg:px-8" id="workflow">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium tracking-[0.24em] text-cyan-200 uppercase">How it works</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-balance md:text-6xl">
            三步完成第一条 AI 短剧生产链路
          </h2>
          <p className="mt-5 text-lg leading-8 text-white/58">
            把复杂技术藏在后台，把用户路径压缩为 Create → Generate → Publish。
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {workflowSteps.map((step, index) => (
            <article
              className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.06] p-6 backdrop-blur-xl"
              key={step.title}
            >
              <div className="absolute right-0 top-0 size-36 translate-x-10 -translate-y-10 rounded-full bg-cyan-300/10 blur-2xl" />
              <div className="relative">
                <div className="mb-10 flex items-center justify-between">
                  <span className="text-sm text-white/35">0{index + 1}</span>
                  <span className="grid size-12 place-items-center rounded-2xl bg-white text-[#050712]">
                    <step.icon />
                  </span>
                </div>
                <p className="text-sm tracking-[0.2em] text-cyan-200 uppercase">{step.title}</p>
                <h3 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{step.subtitle}</h3>
                <p className="mt-4 text-sm leading-7 text-white/58">{step.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

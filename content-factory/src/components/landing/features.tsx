import { features } from "@/components/landing/landing-data";

export function FeaturesSection() {
  return (
    <section className="relative px-5 py-20 lg:px-8">
      <div className="absolute inset-x-0 top-1/3 -z-10 h-80 bg-gradient-to-r from-cyan-500/10 via-fuchsia-500/10 to-blue-500/10 blur-3xl" />
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-medium tracking-[0.24em] text-fuchsia-200 uppercase">AI Engine Features</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-balance md:text-6xl">
            把底层 AI 能力包装成用户能购买的产品
          </h2>
        </div>

        <div className="grid gap-px overflow-hidden rounded-[2rem] border border-white/12 bg-white/10 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article className="bg-[#080b18]/95 p-6 transition hover:bg-white/[0.08]" key={feature.title}>
              <span className="mb-8 grid size-12 place-items-center rounded-2xl bg-white/8 text-cyan-200 ring-1 ring-white/10">
                <feature.icon />
              </span>
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/56">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

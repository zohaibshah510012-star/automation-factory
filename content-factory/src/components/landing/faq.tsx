import { faqs } from "@/components/landing/landing-data";

export function LandingFaq() {
  return (
    <section className="px-5 py-20 lg:px-8" id="faq">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm font-medium tracking-[0.24em] text-cyan-200 uppercase">FAQ</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] md:text-6xl">
            注册前最关心的问题
          </h2>
          <p className="mt-5 text-lg leading-8 text-white/58">
            少讲技术，多回答用户真正会问的：能不能试、怎么开始、适合谁、怎么发布。
          </p>
        </div>

        <div className="grid gap-3">
          {faqs.map((faq) => (
            <article className="rounded-3xl border border-white/12 bg-white/[0.06] p-6" key={faq.question}>
              <h3 className="text-lg font-semibold">{faq.question}</h3>
              <p className="mt-3 leading-7 text-white/58">{faq.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

import { Reveal } from "@/components/marketing/Reveal";

const steps = [
  ["01", "Create your workspace", "Shape custom data structures, fields, and departments around how your startup operates."],
  ["02", "Organize team & projects", "Add your team members, define roles, and structure your company's core project roadmaps."],
  ["03", "Assign tasks & deadlines", "Assign owners, set milestone deadlines, and track real-time delivery with zero ambiguity."],
  ["04", "Automate & scale with Ordis", "Build automated triggers and let Ordis AI monitor workload, deadlines, and project progress."]
] as const;

export function HowItWorks() {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-[#fbfaf7] via-[#f7f5ed]/80 to-[#f8f9f6] py-20 sm:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-10 size-[32rem] rounded-full bg-[#fde2cd]/40 opacity-40 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 bottom-10 size-[34rem] rounded-full bg-[#e2f0e6]/50 opacity-40 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold tracking-[0.16em] text-slate-600 uppercase">HOW IT WORKS</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">A clearer way to get started.</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-500">Build the operating foundation your business can grow with.</p>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-4">
          {steps.map(([number, title, description], index) => (
            <Reveal key={number} delay={index * 0.06}>
              <article className="border-t border-slate-300 pt-5">
                <p className="text-sm font-semibold text-[#6f9f7b]">{number}</p>
                <h3 className="mt-8 text-lg font-semibold text-slate-950">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

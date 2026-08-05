const highlights = [
  {
    title: 'College auth',
    description: 'Credential-based login backed by Prisma, bcrypt, and NextAuth.',
  },
  {
    title: 'Visitor access',
    description: 'A separate visitor account flow with registration endpoints.',
  },
  {
    title: 'Route protection',
    description: 'Server-side request checks for college dashboards and history views.',
  },
]

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_38%),linear-gradient(180deg,#020617_0%,#0f172a_55%,#020617_100%)] px-6 py-10 text-slate-100 sm:px-10 lg:px-14">
      <div className="absolute inset-x-0 top-0 -z-0 h-80 bg-[radial-gradient(circle,_rgba(99,102,241,0.22),_transparent_70%)] blur-3xl" />

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col justify-center gap-10">
        <div className="max-w-3xl space-y-6">
          <p className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200">
            FindUrFest
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Authentication and event infrastructure for campus fest operations.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            This build wires the Prisma schema, NextAuth credentials flow, route handlers, request guards, and shared validation utilities described in the setup prompt.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur"
            >
              <h2 className="text-lg font-semibold text-white">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default function HomePage() {
  const features = [
    {
      icon: (
        <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>
      ),
      title: "Browse ACC Models",
      desc: "Navigate your Autodesk Construction Cloud projects and select any Revit model for instant analysis.",
    },
    {
      icon: (
        <svg className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
        </svg>
      ),
      title: "Auto-Generate Schedules",
      desc: "Extract all Revit categories with family, type, and level breakdown — classified by AI with 100+ built-in categories.",
    },
    {
      icon: (
        <svg className="h-6 w-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
      ),
      title: "Ask AI Anything",
      desc: "Chat with Claude AI about your model — element counts, categories, disciplines, and detailed insights.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col overflow-hidden">
      {/* Ambient glow blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/3 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute top-1/2 -right-32 h-[400px] w-[400px] rounded-full bg-indigo-600/15 blur-[100px]" />
        <div className="absolute -bottom-32 left-1/4 h-[400px] w-[400px] rounded-full bg-violet-600/10 blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-10 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-600 p-2 shadow-lg shadow-blue-600/30">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </div>
          <span className="font-bold text-white text-xl tracking-tight">Forma AI Schedule</span>
        </div>
        <span className="text-sm text-slate-500 font-medium">Reliant Design Solutions</span>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 py-24 text-center">
        {/* Badge */}
        <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-5 py-2 text-sm font-medium text-blue-300 backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
          Powered by Claude AI · Autodesk Platform Services
        </div>

        <h1 className="mb-6 max-w-4xl text-6xl font-bold leading-tight tracking-tight text-white">
          BIM Schedule Generation,{" "}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
            Powered by AI
          </span>
        </h1>

        <p className="mb-12 max-w-2xl text-xl leading-relaxed text-slate-400">
          Connect your Autodesk Construction Cloud models, extract Revit element
          categories, and generate intelligent schedule tables — in seconds.
        </p>

        <a
          href="/api/auth/login"
          className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 px-10 py-5 text-lg font-bold text-white shadow-2xl shadow-blue-500/30 transition-all hover:from-blue-400 hover:to-blue-500 hover:shadow-blue-500/40 hover:-translate-y-0.5"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
          </svg>
          Sign in with Autodesk
          <svg className="h-5 w-5 opacity-60 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </a>

        <p className="mt-5 text-sm text-slate-600">
          Requires an Autodesk Construction Cloud account
        </p>

        {/* Feature cards */}
        <div className="mt-28 grid w-full max-w-4xl grid-cols-1 gap-5 text-left sm:grid-cols-3">
          {features.map((f, idx) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-white/8 bg-white/4 p-7 backdrop-blur-sm transition-all hover:border-blue-500/30 hover:bg-white/6"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="mb-4 inline-flex rounded-xl bg-white/8 p-3 ring-1 ring-white/10">
                {f.icon}
              </div>
              <h3 className="mb-2 text-lg font-bold text-white">{f.title}</h3>
              <p className="text-base leading-relaxed text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className="mt-16 flex items-center gap-10 text-center">
          {[
            { value: "100+", label: "Revit Categories" },
            { value: "AI", label: "Classification" },
            { value: "Excel · CSV · PDF", label: "Export Formats" },
          ].map(s => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-10 py-5 flex items-center justify-between text-sm text-slate-600">
        <span>© 2025 Forma AI Schedule</span>
        <span>Reliant Design Solutions</span>
      </footer>
    </div>
  );
}

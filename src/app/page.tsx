export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-10 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-600 p-2">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-xl">Forma AI Schedule</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-8 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-5 py-2 text-sm font-medium text-blue-600 mb-10">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          Powered by Claude AI · Autodesk APS
        </div>

        <h1 className="text-6xl font-bold text-gray-900 tracking-tight mb-6 leading-tight max-w-3xl">
          BIM Schedule Generation,{" "}
          <span className="text-blue-600">Powered by AI</span>
        </h1>

        <p className="text-xl text-gray-500 mb-12 max-w-2xl leading-relaxed">
          Connect your Autodesk Construction Cloud models, extract Revit element
          categories, and generate intelligent schedule tables instantly.
        </p>

        <a
          href="/api/auth/login"
          className="inline-flex items-center gap-3 rounded-2xl bg-blue-600 px-10 py-5 text-lg font-bold text-white shadow-lg shadow-blue-100 hover:bg-blue-700 transition-colors"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
          </svg>
          Sign in with Autodesk
        </a>

        <p className="mt-5 text-base text-gray-400">
          Requires an Autodesk Construction Cloud account
        </p>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-24 max-w-4xl w-full text-left">
          {[
            {
              icon: (
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
              ),
              title: "Browse ACC Models",
              desc: "Navigate your ACC projects and select any Revit model for analysis.",
            },
            {
              icon: (
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                </svg>
              ),
              title: "Auto-Generate Schedules",
              desc: "Extract all Revit categories with family, type, and level breakdown.",
            },
            {
              icon: (
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              ),
              title: "Ask AI Anything",
              desc: "Chat with Claude AI about your model — counts, categories, and insights.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-gray-100 p-7 hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
              <div className="mb-4 inline-flex rounded-xl bg-blue-50 p-3">{f.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">{f.title}</h3>
              <p className="text-base text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-10 py-5 flex items-center justify-between text-sm text-gray-400">
        <span>Forma AI Schedule</span>
        <span>Reliant Design Solutions</span>
      </footer>
    </div>
  );
}

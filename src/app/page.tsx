export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900">
      <div className="text-center px-6 max-w-xl">
        <div className="mb-6 flex justify-center">
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
            <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </div>
        </div>

        <h1 className="text-4xl font-bold text-white tracking-tight mb-3">
          Forma AI Schedule
        </h1>
        <p className="text-blue-200 text-lg mb-10 leading-relaxed">
          AI-powered BIM schedule generator. Connect your Autodesk ACC or Forma model,
          extract Revit element categories, and generate intelligent schedule tables instantly.
        </p>

        <a
          href="/api/auth/login"
          className="inline-flex items-center gap-3 rounded-xl bg-white px-8 py-4 text-base font-semibold text-blue-900 shadow-lg hover:bg-blue-50 transition-colors"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
          </svg>
          Sign in with Autodesk
        </a>

        <p className="mt-6 text-blue-300 text-sm">
          Requires an Autodesk Construction Cloud or Forma account
        </p>
      </div>
    </div>
  );
}

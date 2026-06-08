export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4 shadow-xl">
            <span className="text-white font-bold text-2xl">SL</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sistema Lavoro</h1>
          <p className="text-blue-300 text-sm mt-1">Piattaforma Gestione Candidature</p>
        </div>
        {children}
      </div>
    </div>
  );
}

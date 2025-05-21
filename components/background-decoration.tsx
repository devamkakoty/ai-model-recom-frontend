export function BackgroundDecoration() {
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-30"></div>

      {/* Decorative circles */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-300/20 dark:bg-indigo-700/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-300/20 dark:bg-purple-700/20 rounded-full blur-3xl"></div>
      <div className="absolute top-3/4 left-2/3 w-72 h-72 bg-blue-300/20 dark:bg-blue-700/20 rounded-full blur-3xl"></div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/30 dark:from-slate-950/80 dark:to-slate-950/30"></div>
    </div>
  )
}

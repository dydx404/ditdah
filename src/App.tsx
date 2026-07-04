/*
 * App shell — placeholder.
 * The real product is a single receiving-practice loop (see ARCHITECTURE.md).
 * This exists only so the scaffold renders something intentional instead of
 * the Vite boilerplate. Replaced once core/audio + core/trainer land.
 */
function App() {
  return (
    <main className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-mono text-5xl font-bold tracking-tight">
        dit<span className="text-accent">dah</span>
      </h1>
      <p className="max-w-md text-muted">
        Learn Morse the way operators actually copy it — by sound. The trainer
        is on its way.
      </p>
    </main>
  )
}

export default App

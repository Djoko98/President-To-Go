"use client";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="grid min-h-dvh place-items-center px-6 text-center"><div><h1 className="text-3xl font-bold">Nešto nije u redu</h1><p className="mt-2 text-neutral-500">Nismo uspeli da učitamo aplikaciju.</p><button onClick={reset} className="mt-6 rounded-full bg-black px-6 py-3 font-bold text-white">Pokušaj ponovo</button></div></main>;
}

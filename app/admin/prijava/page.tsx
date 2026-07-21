import Image from "next/image";
import { LoginForm } from "@/components/admin/login-form";

export default function Page() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#f4f4f2] px-4 py-6">
      <section className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl sm:rounded-[32px] sm:p-7">
        <div className="flex items-center gap-3">
          <Image src="/brand/president-to-go-logo.png" alt="" width={1024} height={1024} priority className="size-14 rounded-2xl border border-black/5 bg-white" />
          <p className="text-sm font-bold uppercase tracking-[.14em] text-neutral-400">President To Go</p>
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-[-.05em]">Admin prijava</h1>
        <p className="mt-2 text-neutral-500">Pristup je dozvoljen samo ovlašćenom osoblju.</p>
        <LoginForm />
      </section>
    </main>
  );
}

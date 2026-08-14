"use client";

import { useActionState, useState } from "react";
import { Check, Copy, KeyRound, RefreshCw, Trash2, UserPlus } from "lucide-react";
import { createStaffAccount, deleteStaffAccount, resetStaffPassword, setStaffActive, updateStaffRole } from "@/features/admin/staff";
import type { StaffMember } from "@/features/admin/staff";
import { SubmitButton } from "@/components/admin/submit-button";
import { generatePassword } from "@/lib/password";
import type { AdminActionState } from "@/features/admin/actions";
import type { AdminRole } from "@/types/domain";

const idle: AdminActionState = { status: "idle", message: "" };
const input = "mt-2 min-h-12 w-full rounded-2xl border border-neutral-200 px-4";
const ROLES: Array<{ value: AdminRole; label: string; hint: string }> = [
  { value: "staff", label: "Osoblje", hint: "Porudžbine i prebacivanje proizvoda na rasprodato." },
  { value: "manager", label: "Menadžer", hint: "Sve osim podešavanja i naloga osoblja." },
  { value: "owner", label: "Vlasnik", hint: "Pun pristup, uključujući naloge i podešavanja." },
];

function PasswordField({ label, initialPassword }: { label: string; initialPassword: string }) {
  const [password, setPassword] = useState(initialPassword);
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(password); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* bez clipboard dozvole se kopira ručno */ }
  }
  return (
    <div>
      <label className="font-bold">{label}</label>
      <div className="mt-2 flex gap-2">
        <input name="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-12 w-full rounded-2xl border border-neutral-200 px-4 font-mono" />
        <button type="button" onClick={() => setPassword(generatePassword())} aria-label="Napravi novu lozinku" className="touch-target grid shrink-0 place-items-center rounded-full bg-neutral-100 transition active:scale-90"><RefreshCw size={18} /></button>
        <button type="button" onClick={copy} aria-label="Kopiraj lozinku" className="touch-target grid shrink-0 place-items-center rounded-full bg-neutral-100 transition active:scale-90">{copied ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}</button>
      </div>
    </div>
  );
}

function ActionMessage({ state }: { state: AdminActionState }) {
  if (state.status === "idle") return null;
  return <p role="status" className={`rounded-2xl p-3 text-sm font-semibold ${state.status === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>{state.message}</p>;
}

function NewStaffForm({ suggestedPassword }: { suggestedPassword: string }) {
  const [state, action] = useActionState(createStaffAccount, idle);
  return (
    <form action={action} className="mt-6 grid gap-5 rounded-3xl bg-white p-4 sm:mt-7 sm:grid-cols-2 sm:rounded-[30px] sm:p-7">
      <div className="sm:col-span-2">
        <h2 className="text-xl font-bold">Dodaj radnika</h2>
        <p className="mt-1 text-sm text-neutral-500">Email ne mora biti pravi sanduče — služi kao korisničko ime. Lozinku prosledi radniku, on se prijavljuje na istoj stranici kao i ti.</p>
      </div>
      <div><label className="font-bold">Ime i prezime</label><input name="fullName" required minLength={2} maxLength={80} autoComplete="off" className={input} /></div>
      <div><label className="font-bold">Email</label><input name="email" type="email" required autoComplete="off" placeholder="mika@presidenttogo.rs" className={input} /></div>
      <PasswordField label="Lozinka" initialPassword={suggestedPassword} />
      <div>
        <label className="font-bold">Uloga</label>
        <select name="role" defaultValue="staff" className={input}>{ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select>
      </div>
      <div className="sm:col-span-2"><ActionMessage state={state} /></div>
      <SubmitButton pendingText="Pravimo nalog…" className="min-h-13 rounded-full bg-black px-6 font-bold text-white sm:col-span-2"><UserPlus size={18} />Napravi nalog</SubmitButton>
    </form>
  );
}

/** Montira se tek na klik, pa lozinka sme da se izvuče u inicijalizatoru — server ovo nikad ne renderuje. */
function ResetPasswordFields({ member, onClose }: { member: StaffMember; onClose: () => void }) {
  const [state, action] = useActionState(resetStaffPassword, idle);
  const [suggestion] = useState(generatePassword);
  return (
    <form action={action} className="w-full space-y-3 rounded-2xl bg-neutral-50 p-4">
      <input type="hidden" name="id" value={member.id} />
      <PasswordField label={`Nova lozinka za ${member.fullName}`} initialPassword={suggestion} />
      <ActionMessage state={state} />
      <div className="flex gap-2">
        <SubmitButton pendingText="Menjamo…" className="min-h-12 flex-1 rounded-full bg-black px-4 text-sm font-bold text-white">Sačuvaj lozinku</SubmitButton>
        <button type="button" onClick={onClose} className="min-h-12 rounded-full px-4 text-sm font-bold text-neutral-600">Zatvori</button>
      </div>
    </form>
  );
}

function ResetPasswordForm({ member }: { member: StaffMember }) {
  const [open, setOpen] = useState(false);
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="flex min-h-12 items-center gap-2 rounded-full bg-neutral-100 px-4 text-sm font-bold transition active:scale-95"><KeyRound size={16} />Nova lozinka</button>;
  return <ResetPasswordFields member={member} onClose={() => setOpen(false)} />;
}

function StaffRow({ member, isSelf }: { member: StaffMember; isSelf: boolean }) {
  const lastSignIn = member.lastSignInAt ? new Intl.DateTimeFormat("sr-Latn-RS", { dateStyle: "medium", timeStyle: "short" }).format(new Date(member.lastSignInAt)) : "još se nije prijavio";
  return (
    <article className={`rounded-3xl bg-white p-4 sm:p-5 ${member.isActive ? "" : "opacity-70"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold">{member.fullName}{isSelf ? <span className="ml-2 text-sm font-semibold text-neutral-400">(ti)</span> : null}</h3>
          <p className="truncate text-sm text-neutral-500">{member.email}</p>
          <p className="mt-1 text-xs font-semibold text-neutral-400">Poslednja prijava: {lastSignIn}</p>
        </div>
        {member.isActive ? null : <span className="rounded-full bg-neutral-200 px-3 py-1 text-xs font-bold uppercase tracking-[.1em] text-neutral-600">Isključen</span>}
      </div>

      {isSelf ? (
        <p className="mt-4 rounded-2xl bg-neutral-50 p-3 text-sm font-semibold text-neutral-500">Sopstveni nalog menjaš samo kroz promenu lozinke, da ne bi slučajno ostao bez pristupa.</p>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <form action={updateStaffRole} className="min-w-0">
            <input type="hidden" name="id" value={member.id} />
            <select name="role" defaultValue={member.role} onChange={(event) => event.currentTarget.form?.requestSubmit()} aria-label={`Uloga za ${member.fullName}`} className="min-h-12 w-full rounded-2xl border border-neutral-200 px-4 font-semibold">
              {ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
            </select>
          </form>
          <form action={setStaffActive}>
            <input type="hidden" name="id" value={member.id} />
            <input type="hidden" name="active" value={member.isActive ? "false" : "true"} />
            <SubmitButton className={`min-h-12 w-full rounded-full px-4 text-sm font-bold ${member.isActive ? "bg-emerald-50 text-emerald-800" : "bg-neutral-100 text-neutral-700"}`}>{member.isActive ? "Pristup uključen" : "Pristup isključen"}</SubmitButton>
          </form>
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <ResetPasswordForm member={member} />
        {isSelf ? null : (
          <form action={deleteStaffAccount} onSubmit={(event) => { if (!window.confirm(`Obrisati nalog „${member.fullName}"? Ako se radnik samo više ne javlja na posao, bolje isključi pristup — brisanje je nepovratno.`)) event.preventDefault(); }}>
            <input type="hidden" name="id" value={member.id} />
            <SubmitButton spinnerSize={16} aria-label={`Obriši nalog ${member.fullName}`} className="min-h-12 rounded-full bg-red-50 px-4 text-sm font-bold text-red-700"><Trash2 size={16} />Obriši nalog</SubmitButton>
          </form>
        )}
      </div>
    </article>
  );
}

export function StaffManager({ staff, ownerId, suggestedPassword }: { staff: StaffMember[]; ownerId: string; suggestedPassword: string }) {
  return (
    <>
      <NewStaffForm suggestedPassword={suggestedPassword} />
      <section className="mt-6 sm:mt-7">
        <h2 className="text-xl font-bold">Nalozi ({staff.length})</h2>
        <dl className="mt-3 grid gap-2 rounded-3xl bg-white p-4 text-sm sm:p-5">
          {ROLES.map((role) => <div key={role.value} className="flex flex-wrap gap-x-2"><dt className="font-bold">{role.label}:</dt><dd className="text-neutral-500">{role.hint}</dd></div>)}
        </dl>
        <div className="mt-3 grid gap-3 sm:gap-4 xl:grid-cols-2">
          {staff.map((member) => <StaffRow key={member.id} member={member} isSelf={member.id === ownerId} />)}
        </div>
      </section>
    </>
  );
}

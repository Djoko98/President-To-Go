"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/security/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminActionState } from "@/features/admin/actions";
import type { AdminRole } from "@/types/domain";

export interface StaffMember { id: string; fullName: string; email: string; role: AdminRole; isActive: boolean; lastSignInAt: string | null; createdAt: string }

const roleSchema = z.enum(["owner", "manager", "staff"]);
const emailSchema = z.string().trim().toLowerCase().email("Unesi ispravnu email adresu.");
const passwordSchema = z.string().min(8, "Lozinka mora imati najmanje 8 znakova.").max(72);
const idSchema = z.string().uuid();

function failure(error: unknown, fallback: string): AdminActionState {
  if (error instanceof z.ZodError) return { status: "error", message: error.issues[0]?.message ?? fallback };
  const message = error instanceof Error ? error.message : "";
  if (message.includes("already been registered") || message.includes("already exists")) return { status: "error", message: "Nalog sa tom email adresom već postoji." };
  return { status: "error", message: message || fallback };
}

/** Vlasnik jedini upravlja nalozima, i nikada ne sme sebi da oduzme pristup. */
async function requireOwner() {
  const { profile } = await requireAdmin(["owner"]);
  return { owner: profile, admin: createAdminClient() };
}

export async function listStaff(): Promise<StaffMember[]> {
  const { admin } = await requireOwner();
  const [{ data: authData, error: authError }, { data: profiles, error: profileError }] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    admin.from("profiles").select("id,full_name,role,is_active,created_at"),
  ]);
  if (authError) throw new Error(authError.message);
  if (profileError) throw new Error(profileError.message);
  const accounts = new Map(authData.users.map((user) => [user.id, user]));
  // Profil je merodavan: auth nalog bez profila nema pristup i ne prikazuje se kao osoblje.
  return (profiles ?? [])
    .flatMap((profile) => {
      const account = accounts.get(profile.id);
      if (!account) return [];
      return [{ id: profile.id, fullName: profile.full_name, email: account.email ?? "", role: profile.role, isActive: profile.is_active, lastSignInAt: account.last_sign_in_at ?? null, createdAt: profile.created_at }];
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "sr"));
}

export async function createStaffAccount(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  let createdUserId: string | null = null;
  try {
    const { admin } = await requireOwner();
    const fullName = z.string().trim().min(2, "Unesi ime i prezime.").max(80).parse(formData.get("fullName"));
    const email = emailSchema.parse(formData.get("email"));
    const password = passwordSchema.parse(formData.get("password"));
    const role = roleSchema.parse(formData.get("role"));
    // email_confirm preskače potvrdu mejlom — adresa sme da bude interna, lozinku vlasnik predaje uživo.
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: fullName } });
    if (error) throw error;
    createdUserId = data.user.id;
    const { error: profileError } = await admin.from("profiles").insert({ id: data.user.id, full_name: fullName, role, is_active: true });
    if (profileError) throw new Error(profileError.message);
    revalidatePath("/admin/osoblje");
    return { status: "success", message: `Nalog za ${fullName} je napravljen. Prosledi mu email i lozinku.` };
  } catch (error) {
    // Nalog bez profila ne bi mogao da uđe, ali bi zauzeo email adresu za sledeći pokušaj.
    if (createdUserId) await createAdminClient().auth.admin.deleteUser(createdUserId).catch(() => undefined);
    return failure(error, "Nalog nije napravljen.");
  }
}

export async function updateStaffRole(formData: FormData) {
  const { owner, admin } = await requireOwner();
  const id = idSchema.parse(formData.get("id"));
  const role = roleSchema.parse(formData.get("role"));
  if (id === owner.id) throw new Error("Ne možeš sebi promeniti ulogu.");
  const { error } = await admin.from("profiles").update({ role }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/osoblje");
}

export async function setStaffActive(formData: FormData) {
  const { owner, admin } = await requireOwner();
  const id = idSchema.parse(formData.get("id"));
  const isActive = formData.get("active") === "true";
  if (id === owner.id) throw new Error("Ne možeš sebi ugasiti pristup.");
  const { error } = await admin.from("profiles").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/osoblje");
}

export async function resetStaffPassword(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const { admin } = await requireOwner();
    const id = idSchema.parse(formData.get("id"));
    const password = passwordSchema.parse(formData.get("password"));
    const { error } = await admin.auth.admin.updateUserById(id, { password });
    if (error) throw error;
    revalidatePath("/admin/osoblje");
    return { status: "success", message: "Lozinka je promenjena. Prosledi je radniku." };
  } catch (error) {
    return failure(error, "Lozinka nije promenjena.");
  }
}

export async function deleteStaffAccount(formData: FormData) {
  const { owner, admin } = await requireOwner();
  const id = idSchema.parse(formData.get("id"));
  if (id === owner.id) throw new Error("Ne možeš obrisati sopstveni nalog.");
  // Istorija ostaje čitljiva: order_status_events.changed_by pada na null umesto da povuče porudžbinu.
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/osoblje");
}

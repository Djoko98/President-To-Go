import { StaffManager } from "@/components/admin/staff-manager";
import { listStaff } from "@/features/admin/staff";
import { requireAdmin } from "@/lib/security/admin";
import { generatePassword } from "@/lib/password";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { profile } = await requireAdmin(["owner"]);
  const staff = await listStaff();

  return (
    <main className="p-5 sm:p-8">
      <p className="text-sm font-semibold text-neutral-500">Owner pristup</p>
      <h1 className="text-3xl font-bold tracking-[-.05em] sm:text-4xl">Osoblje</h1>
      <StaffManager staff={staff} ownerId={profile.id} suggestedPassword={generatePassword()} />
    </main>
  );
}

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AppRole } from "@/lib/constants";

export type StaffProfile = {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  role: AppRole;
  department_id: string | null;
  department_name: string | null;
  station: string | null;
  is_active: boolean;
};

/**
 * Resolves the staff profile for the signed-in user.
 * On first sign-in it claims a seeded profile with the same email (keeping its
 * pre-assigned role and department) or creates a new Account Officer profile,
 * then makes sure the matching row exists in user_roles.
 */
export const ensureProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<StaffProfile | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;
    const email = String(context.claims?.["email"] ?? "").toLowerCase();

    // 1. Already linked?
    let { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*, departments(name)")
      .eq("user_id", userId)
      .maybeSingle();

    // 2. Claim a seeded profile with the same email.
    if (!profile && email) {
      const { data: seeded } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", email)
        .is("user_id", null)
        .maybeSingle();

      if (seeded) {
        const { data: claimed } = await supabaseAdmin
          .from("profiles")
          .update({ user_id: userId })
          .eq("id", seeded.id)
          .select("*, departments(name)")
          .single();
        profile = claimed;
      }
    }

    // 3. Brand new staff member.
    if (!profile && email) {
      const { data: created } = await supabaseAdmin
        .from("profiles")
        .insert({
          user_id: userId,
          email,
          full_name: String(context.claims?.["name"] ?? email.split("@")[0]),
          intended_role: "account_officer",
        })
        .select("*, departments(name)")
        .single();
      profile = created;
    }

    if (!profile) return null;

    // 4. Keep user_roles in sync (roles never live on the profile row alone).
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: profile.intended_role }, { onConflict: "user_id,role" });

    const dept = (profile as unknown as { departments: { name: string } | null }).departments;

    return {
      id: profile.id,
      user_id: profile.user_id,
      full_name: profile.full_name,
      email: profile.email,
      role: profile.intended_role as AppRole,
      department_id: profile.department_id,
      department_name: dept?.name ?? null,
      station: profile.station,
      is_active: profile.is_active,
    };
  });

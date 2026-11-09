import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Throws unless the caller holds the Admin Officer role. */
async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin_officer",
  });
  if (error) throw new Error("Could not verify your role.");
  if (!data) throw new Error("Only Admin Officers can perform this action.");
}

/** Lists the register's tables with their column definitions. */
export const listSchema = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("exec_readonly_sql", {
      query_text: `select table_name, column_name, data_type, is_nullable
                   from information_schema.columns
                   where table_schema = 'public'
                   order by table_name, ordinal_position`,
    });
    if (error) throw new Error(error.message);
    return data as {
      table_name: string;
      column_name: string;
      data_type: string;
      is_nullable: string;
    }[];
  });

/** A single row returned by the read-only SQL console (JSON-safe values only). */
export type SqlRow = Record<string, string | number | boolean | null>;

/** Runs a read-only SELECT query. Anything else is rejected by the database. */
export const runReadOnlyQuery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sql: string }) => z.object({ sql: z.string().min(6) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.rpc("exec_readonly_sql", {
      query_text: data.sql,
    });
    if (error) return { rows: null as SqlRow[] | null, error: error.message as string | null };
    return { rows: (rows ?? []) as SqlRow[], error: null as string | null };
  });

/** Creates a staff login and its profile/role rows. */
export const createStaffAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        email: z.string().email(),
        password: z.string().min(8),
        full_name: z.string().min(2),
        role: z.enum(["admin_officer", "station_manager", "account_officer"]),
        department_id: z.string().uuid().nullable().optional(),
        station: z.string().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { name: data.full_name },
    });
    if (error) throw new Error(error.message);
    const userId = created.user!.id;

    await supabaseAdmin.from("profiles").upsert(
      {
        user_id: userId,
        email: data.email.toLowerCase(),
        full_name: data.full_name,
        intended_role: data.role,
        department_id: data.department_id ?? null,
        station: data.station ?? null,
      },
      { onConflict: "email" },
    );
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: data.role }, { onConflict: "user_id,role" });

    return { ok: true };
  });

/** Changes a staff member's role (profile + user_roles stay in sync). */
export const updateStaffRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        profile_id: z.string().uuid(),
        role: z.enum(["admin_officer", "station_manager", "account_officer"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .update({ intended_role: data.role })
      .eq("id", data.profile_id)
      .select("user_id")
      .single();
    if (error) throw new Error(error.message);

    if (profile?.user_id) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", profile.user_id);
      await supabaseAdmin.from("user_roles").insert({ user_id: profile.user_id, role: data.role });
    }
    return { ok: true };
  });

import { createClient } from "@/lib/supabase/server";
import AdminSidebar from "@/components/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The /admin/login page renders its own centered form and doesn't need the sidebar.
  // We detect it isn't wrapped by checking for a logged-in admin below; login page
  // itself is excluded from the middleware's auth check.
  if (!user) {
    return <div className="min-h-[70vh]">{children}</div>;
  }

  const { data: adminRow } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRow) {
    return (
      <div className="container-page flex min-h-[70vh] flex-col items-center justify-center gap-3 text-center">
        <h1 className="font-display text-2xl font-semibold text-paper">
          Not authorized
        </h1>
        <p className="max-w-sm text-muted">
          This account is signed in but is not registered as an admin. Add
          this user's ID to the <code>admins</code> table in Supabase.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh]">
      <AdminSidebar />
      <div className="flex-1 p-8">{children}</div>
    </div>
  );
}

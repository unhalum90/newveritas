import { AdminSidebar } from "@/components/app/admin-sidebar";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";

export default async function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformAdmin();

  const navItems = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/users", label: "User Management" },
    { href: "/admin/api", label: "API Usage" },
    { href: "/admin/logs", label: "System Logs" },
    { href: "/admin/support", label: "Support Queue" },
  ];

  return (
    <div className="veritas-wizard min-h-screen bg-[radial-gradient(1200px_circle_at_20%_-10%,#1b2635_0%,#0b0f14_45%,#07090d_100%)] text-[var(--text)]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <AdminSidebar items={navItems} />
        <main className="flex-1 px-6 py-8 lg:px-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

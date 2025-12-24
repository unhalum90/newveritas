"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function DisabledAccount() {
  const router = useRouter();
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <h1 className="text-xl font-semibold text-[var(--text)]">Account Disabled</h1>
      <p className="max-w-md text-center text-sm text-[var(--muted)]">
        Your account has been disabled by your school administrator. Contact your IT/EdTech team for access.
      </p>
      <Button
        variant="secondary"
        onClick={async () => {
          const supabase = createSupabaseBrowserClient();
          await supabase.auth.signOut();
          router.push("/login");
          router.refresh();
        }}
      >
        Sign out
      </Button>
    </div>
  );
}


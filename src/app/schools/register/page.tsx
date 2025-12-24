import { Suspense } from "react";

import SchoolRegisterClient from "./school-register-client";

export const dynamic = "force-dynamic";

export default function SchoolRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 flex items-center justify-center">Loading…</div>}>
      <SchoolRegisterClient />
    </Suspense>
  );
}

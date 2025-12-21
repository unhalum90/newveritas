import { Suspense } from "react";

import { StudentLoginClient } from "@/app/student/login/student-login-client";

export default function StudentLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50" />}>
      <StudentLoginClient />
    </Suspense>
  );
}


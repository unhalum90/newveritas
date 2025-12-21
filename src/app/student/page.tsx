import { Suspense } from "react";

import { StudentDashboardClient } from "@/app/student/student-dashboard-client";

export default function StudentHomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50" />}>
      <StudentDashboardClient />
    </Suspense>
  );
}


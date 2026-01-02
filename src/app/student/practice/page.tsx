import { Suspense } from "react";

import { StudentPracticeClient } from "@/app/student/practice/student-practice-client";

export default function StudentPracticePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50" />}>
      <StudentPracticeClient />
    </Suspense>
  );
}

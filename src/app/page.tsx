import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-6">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Veritas</CardTitle>
          <CardDescription>Teacher-focused oral assessments with AI-assisted scoring.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Link href="/login" className="w-full">
            <Button type="button" className="w-full">
              Sign In
            </Button>
          </Link>
          <Link href="/signup" className="w-full">
            <Button type="button" variant="secondary" className="w-full">
              Create Account
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

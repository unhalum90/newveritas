import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>Profile editing comes after onboarding in v1.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-[var(--muted)]">Placeholder.</div>
      </CardContent>
    </Card>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function StyleguidePage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Styleguide</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Design tokens are implemented via CSS variables (see `veritas/src/app/globals.css`).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Core Components</CardTitle>
          <CardDescription>Buttons, inputs, cards, and switches.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button disabled>Disabled</Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sg-input">Input</Label>
              <Input id="sg-input" placeholder="Type here…" />
            </div>
            <div className="space-y-2">
              <Label>Switch</Label>
              <div className="flex items-center gap-3">
                <Switch checked={true} onCheckedChange={() => {}} aria-label="On" />
                <Switch checked={false} onCheckedChange={() => {}} aria-label="Off" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="veritas-wizard rounded-[12px] border border-[var(--border)] bg-[var(--background)] p-6 text-[var(--text)]">
        <h2 className="text-xl font-semibold">Wizard Theme Preview</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          This matches the assessment builder wizard styling.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_350px]">
          <Card>
            <CardHeader>
              <CardTitle>Card</CardTitle>
              <CardDescription>Surface / border / typography tokens.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sg-wizard-input">Wizard input</Label>
                <Input id="sg-wizard-input" placeholder="Dark input…" />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Context Panel</CardTitle>
              <CardDescription>Sticky panel tokens.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-[var(--text)]">Example toggle</div>
                  <div className="text-xs text-[var(--muted)]">With a tooltip</div>
                </div>
                <Switch checked={true} onCheckedChange={() => {}} aria-label="Example" />
              </div>
              <div className="space-y-2">
                <Label>Example dropdown</Label>
                <select className="h-10 w-full rounded-md border bg-[var(--surface)] px-3 text-sm text-[var(--text)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                  <option>Option A</option>
                  <option>Option B</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


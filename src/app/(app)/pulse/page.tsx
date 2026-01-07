import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PulsePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-[var(--text)]">Pulse</h1>
                <p className="mt-1 text-sm text-[var(--muted)]">
                    Audio summary of learning progress.
                </p>
            </div>

            <Card className="bg-[var(--surface)] border-[var(--border)]">
                <CardHeader>
                    <CardTitle>Coming Soon</CardTitle>
                    <CardDescription>
                        The Pulse dashboard will provide AI-generated audio summaries of student performance.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                        <div className="rounded-full bg-blue-100 p-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-blue-600"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
                        </div>
                        <p className="text-[var(--muted)] max-w-sm">
                            Pulse analyzes formative and summative data to give you a daily simplified audio briefing.
                        </p>
                        <Button disabled variant="secondary">Join Waitlist</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

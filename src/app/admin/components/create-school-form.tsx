"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreatedSchool {
    school: { id: string; name: string };
    admin: { id: string; email: string; invite_sent: boolean };
}

export function CreateSchoolForm() {
    const [schoolName, setSchoolName] = useState("");
    const [country, setCountry] = useState("");
    const [schoolType, setSchoolType] = useState("");
    const [adminEmail, setAdminEmail] = useState("");
    const [adminFirstName, setAdminFirstName] = useState("");
    const [adminLastName, setAdminLastName] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<CreatedSchool | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch("/api/admin/schools/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    school_name: schoolName,
                    country: country || null,
                    school_type: schoolType || null,
                    admin_email: adminEmail,
                    admin_first_name: adminFirstName,
                    admin_last_name: adminLastName,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to create school");
                return;
            }

            setSuccess(data);
            // Clear form
            setSchoolName("");
            setCountry("");
            setSchoolType("");
            setAdminEmail("");
            setAdminFirstName("");
            setAdminLastName("");
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-4">
            {success ? (
                <div className="rounded-lg border border-[rgba(20,184,166,0.4)] bg-[rgba(20,184,166,0.1)] p-4">
                    <div className="font-semibold text-[#5eead4]">✓ School Created Successfully</div>
                    <div className="mt-2 space-y-1 text-sm text-[var(--muted)]">
                        <div>
                            <span className="text-[var(--text)]">School:</span> {success.school.name}
                        </div>
                        <div>
                            <span className="text-[var(--text)]">Admin:</span> {success.admin.email}
                        </div>
                        <div>
                            <span className="text-[var(--text)]">Invite:</span>{" "}
                            {success.admin.invite_sent ? (
                                <span className="text-[#5eead4]">Sent ✓</span>
                            ) : (
                                <span className="text-[#fbbf24]">Failed to send (user can reset password)</span>
                            )}
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="mt-3"
                        onClick={() => setSuccess(null)}
                    >
                        Create Another
                    </Button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="schoolName">School Name *</Label>
                            <Input
                                id="schoolName"
                                value={schoolName}
                                onChange={(e) => setSchoolName(e.target.value)}
                                placeholder="e.g., Lincoln Middle School"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="country">Country</Label>
                            <Input
                                id="country"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                placeholder="e.g., United States"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="schoolType">School Type</Label>
                            <Input
                                id="schoolType"
                                value={schoolType}
                                onChange={(e) => setSchoolType(e.target.value)}
                                placeholder="e.g., K-12, Higher Ed"
                            />
                        </div>
                    </div>

                    <div className="border-t border-[rgba(148,163,184,0.15)] pt-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)] mb-3">
                            School Admin Account
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="adminFirstName">First Name *</Label>
                                <Input
                                    id="adminFirstName"
                                    value={adminFirstName}
                                    onChange={(e) => setAdminFirstName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="adminLastName">Last Name *</Label>
                                <Input
                                    id="adminLastName"
                                    value={adminLastName}
                                    onChange={(e) => setAdminLastName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="adminEmail">Email *</Label>
                                <Input
                                    id="adminEmail"
                                    type="email"
                                    value={adminEmail}
                                    onChange={(e) => setAdminEmail(e.target.value)}
                                    placeholder="admin@school.edu"
                                    required
                                />
                                <p className="text-xs text-[var(--muted)]">
                                    A magic link invite will be sent to this email.
                                </p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-md border border-[rgba(248,113,113,0.4)] bg-[rgba(248,113,113,0.1)] px-3 py-2 text-sm text-[#fca5a5]">
                            {error}
                        </div>
                    )}

                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? "Creating..." : "Create School & Send Invite"}
                    </Button>
                </form>
            )}
        </div>
    );
}

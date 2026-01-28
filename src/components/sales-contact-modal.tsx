"use client";

import { useState, type FormEvent } from "react";

export function SalesContactModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [formData, setFormData] = useState({ name: "", email: "", note: "" });

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setStatus("loading");

        try {
            const res = await fetch("/api/contact/sales", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error("Failed to send");

            setStatus("success");
            setTimeout(() => {
                setIsOpen(false);
                setStatus("idle");
                setFormData({ name: "", email: "", note: "" });
            }, 2000);
        } catch (error) {
            setStatus("error");
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex h-12 items-center justify-center rounded-md border-2 border-[var(--border)] bg-transparent px-8 text-base hover:bg-[var(--surface)] text-[var(--text)] transition-colors"
            >
                Talk to Sales
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                    <div
                        className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-2xl animate-in zoom-in-95 duration-200"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Talk to Sales</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-[var(--muted)] hover:text-[var(--text)]"
                            >
                                ✕
                            </button>
                        </div>

                        {status === "success" ? (
                            <div className="py-12 text-center">
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                                    ✓
                                </div>
                                <h3 className="text-lg font-medium">Message Sent!</h3>
                                <p className="mt-2 text-[var(--muted)]">We&apos;ll get back to you shortly.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
                                    <input
                                        id="name"
                                        required
                                        type="text"
                                        className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--text)]"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                                    <input
                                        id="email"
                                        required
                                        type="email"
                                        className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--text)]"
                                        value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="note" className="block text-sm font-medium mb-1">Note (Optional)</label>
                                    <textarea
                                        id="note"
                                        rows={3}
                                        className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none text-[var(--text)]"
                                        value={formData.note}
                                        onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                                    />
                                </div>

                                {status === "error" && (
                                    <p className="text-sm text-red-500">Something went wrong. Please try again.</p>
                                )}

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--text)]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={status === "loading"}
                                        className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-strong)] disabled:opacity-50"
                                    >
                                        {status === "loading" ? "Sending..." : "Send Message"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

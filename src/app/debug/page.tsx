
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DebugPage() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>Not logged in</div>;

    const { data: activities, error } = await supabase
        .from("formative_activities")
        .select("*");

    return (
        <div className="p-8 font-mono text-sm">
            <h1 className="text-xl font-bold mb-4">Debug: Formative Activities</h1>
            <p>User ID: {user.id}</p>

            {error && (
                <div className="text-red-500 my-4">
                    Error: {JSON.stringify(error, null, 2)}
                </div>
            )}

            <div className="space-y-4 mt-8">
                {activities?.map(a => (
                    <div key={a.id} className="border p-4 rounded bg-gray-50">
                        <div className="font-bold">{a.title}</div>
                        <div>ID: {a.id}</div>
                        <div>Type: {a.type}</div>
                        <div>Status: {a.status}</div>
                        <div>Teacher ID: {a.teacher_id}</div>
                        <div>Match User? {a.teacher_id === user.id ? "YES" : "NO"}</div>
                    </div>
                ))}
                {activities?.length === 0 && <div>No activities found in DB (visible to you).</div>}
            </div>
        </div>
    );
}

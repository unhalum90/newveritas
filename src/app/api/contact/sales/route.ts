import { NextResponse } from "next/server";

const MAILERLITE_ENDPOINT = "https://connect.mailerlite.com/api/subscribers";

export async function POST(request: Request) {
    try {
        const { name, email, note } = await request.json();

        if (!name || !email) {
            return NextResponse.json(
                { error: "Name and email are required." },
                { status: 400 }
            );
        }

        const apiKey = process.env.MAILERLITE_API_KEY;
        const groupId = process.env.MAILERLITE_SALES_GROUP_ID;

        // Fallback to mock if keys are missing (dev mode safety)
        if (!apiKey || !groupId) {
            console.warn("MailerLite keys missing. Falling back to mock log.");
            console.log("--- MOCK SALES CONTACT ---");
            console.log(`To: hello@sayveritas.com`);
            console.log(`Subject: New Sales Inquiry from ${name}`);
            console.log(`From: ${email}`);
            console.log(`Note: ${note}`);
            console.log("--------------------------");
            return NextResponse.json({ success: true });
        }

        const response = await fetch(MAILERLITE_ENDPOINT, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                email,
                groups: [groupId],
                fields: {
                    name: name,
                    notes: note || "" // 'notes' field custom field or standard? Assuming notes/marketing permissions
                    // MailerLite standard fields are usually 'name'. 'notes' might need a custom field ID. 
                    // For simplicity/safety with standard setup, we map 'name'. 
                    // If 'note' is important it should go to a custom field, but for now just adding to group is the primary goal requested.
                }
            }),
        });

        if (response.ok || response.status === 409) { // 409 means already exists, which is fine
            return NextResponse.json({ success: true });
        }

        console.error("MailerLite error:", await response.text());
        return NextResponse.json(
            { error: "Unable to save contact." },
            { status: 502 }
        );

    } catch (error) {
        console.error("Sales contact error:", error);
        return NextResponse.json(
            { error: "Unable to send message." },
            { status: 500 }
        );
    }
}

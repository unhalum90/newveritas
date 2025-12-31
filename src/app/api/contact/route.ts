import { NextResponse } from "next/server";

const MAILERLITE_ENDPOINT = "https://connect.mailerlite.com/api/subscribers";

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export async function POST(request: Request) {
  let payload: { name?: unknown; email?: unknown; note?: unknown } = {};

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const note = typeof payload.note === "string" ? payload.note.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!note) {
    return NextResponse.json({ error: "Please enter a note." }, { status: 400 });
  }

  const apiKey = process.env.MAILERLITE_API_KEY;
  const groupId = process.env.MAILERLITE_CONTACT_GROUP_ID;

  if (!apiKey || !groupId) {
    return NextResponse.json({ error: "Contact form not configured." }, { status: 500 });
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
        name,
        note,
      },
    }),
  });

  if (response.ok || response.status === 409) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unable to send your message right now." }, { status: 502 });
}

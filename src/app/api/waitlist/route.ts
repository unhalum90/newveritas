import { NextResponse } from "next/server";

const MAILERLITE_ENDPOINT = "https://connect.mailerlite.com/api/subscribers";

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export async function POST(request: Request) {
  let payload: { email?: unknown } = {};

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const apiKey = process.env.MAILERLITE_API_KEY;
  const groupId = process.env.MAILERLITE_NEWUSERS_GROUP_ID;

  if (!apiKey || !groupId) {
    return NextResponse.json({ error: "Waitlist not configured." }, { status: 500 });
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
    }),
  });

  if (response.ok || response.status === 409) {
    return NextResponse.json({ ok: true });
  }

  const errorText = await response.text();
  console.error(`MailerLite Error (${response.status}):`, errorText);

  return NextResponse.json({
    error: "Unable to join the waitlist right now.",
    details: errorText,
    upstreamStatus: response.status
  }, { status: 502 });
}

import { NextResponse } from "next/server";

const MAILERLITE_ENDPOINT = "https://connect.mailerlite.com/api/subscribers";

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

type WebinarPayload = {
  name?: unknown;
  school?: unknown;
  position?: unknown;
  email?: unknown;
  session?: unknown;
};

export async function POST(request: Request) {
  let payload: WebinarPayload = {};

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const school = typeof payload.school === "string" ? payload.school.trim() : "";
  const position = typeof payload.position === "string" ? payload.position.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const session = typeof payload.session === "string" ? payload.session.trim() : "";

  if (!name) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (!school) return NextResponse.json({ error: "Please enter your school." }, { status: 400 });
  if (!position) return NextResponse.json({ error: "Please enter your position." }, { status: 400 });
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!session) return NextResponse.json({ error: "Please choose a session time." }, { status: 400 });

  const apiKey = process.env.MAILERLITE_API_KEY;
  const groupId = process.env.MAILERLITE_WEBINAR_GROUP_ID;

  if (!apiKey || !groupId) {
    return NextResponse.json({ error: "Webinar signup not configured." }, { status: 500 });
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
        school,
        position,
        session,
      },
    }),
  });

  if (response.ok || response.status === 409) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unable to register right now." }, { status: 502 });
}

import { NextResponse } from "next/server";
import { buildContactTemplateParams, type ContactEmailPayload } from "@/lib/email/contactEmail";

// The route needs access to the private EmailJS credentials. We explicitly opt into the
// Node.js runtime to ensure that the server-side environment variables are available even
// when the rest of the application prefers running on the Edge runtime.
export const runtime = "nodejs";

const EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";

const SERVICE_ID = process.env.EMAILJS_SERVICE_ID ?? process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID ?? process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
const PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY;

const REQUIRED_ENV_VARS = {
  EMAILJS_SERVICE_ID: SERVICE_ID,
  EMAILJS_TEMPLATE_ID: TEMPLATE_ID,
  EMAILJS_PUBLIC_KEY: PUBLIC_KEY,
};

const isPayloadValid = (payload: ContactEmailPayload) => {
  return Boolean(payload?.name && payload?.email && payload?.message);
};

export async function POST(request: Request) {
  let payload: ContactEmailPayload;

  try {
    payload = (await request.json()) as ContactEmailPayload;
  } catch (error) {
    return NextResponse.json(
      { error: "Ungültige Daten im Anfragekörper.", details: error instanceof Error ? error.message : undefined },
      { status: 400 },
    );
  }

  if (!isPayloadValid(payload)) {
    return NextResponse.json(
      { error: "Es fehlen Pflichtfelder für die Kontaktanfrage." },
      { status: 422 },
    );
  }

  const missingEnv = Object.entries(REQUIRED_ENV_VARS).filter(([, value]) => !value);

  if (missingEnv.length > 0) {
    return NextResponse.json(
      {
        error: "Die E-Mail-Benachrichtigung ist nicht konfiguriert.",
        details: `Missing env vars: ${missingEnv.map(([key]) => key).join(", ")}`,
      },
      { status: 500 },
    );
  }

  const templateParams = buildContactTemplateParams(payload);

  const emailBody: Record<string, unknown> = {
    service_id: SERVICE_ID,
    template_id: TEMPLATE_ID,
    public_key: PUBLIC_KEY,
    template_params: templateParams,
  };

  if (PRIVATE_KEY) {
    emailBody.accessToken = PRIVATE_KEY;
  }

  // Older EmailJS clients still expect user_id, so we send both for compatibility.
  emailBody.user_id = PUBLIC_KEY;

  try {
    const response = await fetch(EMAILJS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailBody),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return NextResponse.json(
        {
          error: "EmailJS hat die Anfrage abgelehnt.",
          details: errorText || `Status ${response.status}`,
        },
        { status: 502 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Die Anfrage an EmailJS ist fehlgeschlagen.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true });
}

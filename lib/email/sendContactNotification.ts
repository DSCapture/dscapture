export interface ContactEmailPayload {
  name: string;
  email: string;
  subject?: string;
  phone?: string;
  message: string;
  hasAcceptedPrivacy: boolean;
  submittedAt?: string;
}

interface ContactEmailTemplateParams {
  customer_name: string;
  customer_email: string;
  customer_subject: string;
  customer_phone: string;
  customer_message: string;
  privacy_status: string;
  submitted_at: string;
}

const EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";
const EMAILJS_SERVICE_ID = "service_x78b04t";
const EMAILJS_TEMPLATE_ID = "template_jua3irc";
const EMAILJS_PUBLIC_KEY = "4sw-XsEGxDTv1Z4I0";

const buildTemplateParams = (payload: ContactEmailPayload): ContactEmailTemplateParams => {
  const fallbackSubject = "Allgemeine Anfrage";
  const fallbackPhone = "Keine Telefonnummer angegeben";
  const formattedSubject = payload.subject?.trim() || fallbackSubject;
  const formattedPhone = payload.phone?.trim() || fallbackPhone;
  const submittedAt = payload.submittedAt
    ? new Date(payload.submittedAt).toLocaleString("de-DE", { timeZone: "Europe/Berlin" })
    : new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" });

  return {
    customer_name: payload.name,
    customer_email: payload.email,
    customer_subject: formattedSubject,
    customer_phone: formattedPhone,
    customer_message: payload.message,
    privacy_status: payload.hasAcceptedPrivacy ? "Ja" : "Nein",
    submitted_at: submittedAt,
  };
};

export const sendContactNotification = async (payload: ContactEmailPayload) => {
  const response = await fetch(EMAILJS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      public_key: EMAILJS_PUBLIC_KEY,
      template_params: buildTemplateParams(payload),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`EmailJS responded with ${response.status}${errorText ? `: ${errorText}` : ""}`);
  }
};

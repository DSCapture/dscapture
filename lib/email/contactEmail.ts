export interface ContactEmailPayload {
  name: string;
  email: string;
  subject?: string;
  phone?: string;
  message: string;
  hasAcceptedPrivacy: boolean;
  submittedAt?: string;
}

export interface ContactEmailTemplateParams {
  customer_name: string;
  customer_email: string;
  customer_subject: string;
  customer_phone: string;
  customer_message: string;
  privacy_status: string;
  submitted_at: string;
}

const FALLBACK_SUBJECT = "Allgemeine Anfrage";
const FALLBACK_PHONE = "Keine Telefonnummer angegeben";
const LOCALE = "de-DE";
const TIME_ZONE = "Europe/Berlin";

const formatDate = (value?: string) => {
  const targetDate = value ? new Date(value) : new Date();
  return targetDate.toLocaleString(LOCALE, { timeZone: TIME_ZONE });
};

export const buildContactTemplateParams = (
  payload: ContactEmailPayload,
): ContactEmailTemplateParams => ({
  customer_name: payload.name,
  customer_email: payload.email,
  customer_subject: payload.subject?.trim() || FALLBACK_SUBJECT,
  customer_phone: payload.phone?.trim() || FALLBACK_PHONE,
  customer_message: payload.message,
  privacy_status: payload.hasAcceptedPrivacy ? "Ja" : "Nein",
  submitted_at: formatDate(payload.submittedAt),
});

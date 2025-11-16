import type { ContactEmailPayload } from "./contactEmail";

const API_ENDPOINT = "/api/contact-notification";

export const sendContactNotification = async (payload: ContactEmailPayload) => {
  const response = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Contact notification failed with ${response.status}${errorText ? `: ${errorText}` : ""}`,
    );
  }
};

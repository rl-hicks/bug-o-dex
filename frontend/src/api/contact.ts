import { API_BASE_URL } from "./client";

export type ContactMessageInput = {
  name?: string;
  email?: string;
  message: string;
};

export async function sendContactMessage(
  input: ContactMessageInput
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/contact-messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Failed to send contact message");
  }

  return response.json();
}

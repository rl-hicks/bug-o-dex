import { logoutAndRedirect } from "../utils/auth";
import { API_BASE_URL } from "./client";

export type IdentifyRequest = {
  image_url: string;
  location_context: string;
  date_found?: string;
  notes?: string;
};

export type IdentifyResponse = {
  common_name: string;
  category: string;
  short_description: string;
  confidence_note: string;
  safety_note: string;
  best_guess_disclaimer: string;
};

export async function identifyBug(
  payload: IdentifyRequest
): Promise<IdentifyResponse> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    logoutAndRedirect();
    throw new Error("Unauthorized");
  }

  const response = await fetch(`${API_BASE_URL}/identify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    logoutAndRedirect();
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Bug identification failed: ${response.status} ${errorText}`
    );
  }

  return response.json();
}

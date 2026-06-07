import { logoutAndRedirect } from "../utils/auth";
import { API_BASE_URL } from "./client";

export type UploadImageResponse = {
  image_url: string;
};

export async function uploadImage(file: File): Promise<UploadImageResponse> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    logoutAndRedirect();
    throw new Error("Unauthorized");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/uploads`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (response.status === 401) {
    logoutAndRedirect();
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Image upload failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

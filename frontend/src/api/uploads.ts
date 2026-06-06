const API_BASE_URL = "http://localhost:8000";

export type UploadImageResponse = {
  image_url: string;
};

export async function uploadImage(file: File): Promise<UploadImageResponse> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("Missing access token. Please log in again.");
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

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Image upload failed: ${response.status} ${errorText}`);
  }

  return response.json();
}
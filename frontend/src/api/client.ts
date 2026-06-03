const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function getHealth(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error("Failed to reach backend");
  }

  return response.json();
}
const API_BASE_URL = "http://localhost:8000";

function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}

function getAuthHeaders() {
  const token = getAccessToken();

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export type BugEntry = {
  id: string;
  image_url: string;
  common_name: string;
  category: string | null;
  date_found: string | null;
};

export async function getBugEntries(): Promise<BugEntry[]> {
  const response = await fetch(
    `${API_BASE_URL}/bug-entries`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load bug entries");
  }

  return response.json();
}
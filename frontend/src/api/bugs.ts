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
  ai_identification: string | null;
  confidence_note: string | null;
  short_description: string | null;
  safety_note: string | null;
  location_context: string | null;
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

export async function getBugEntry(id: string): Promise<BugEntry> {
  const response = await fetch(`${API_BASE_URL}/bug-entries/${id}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to load bug entry");
  }

  return response.json();
}
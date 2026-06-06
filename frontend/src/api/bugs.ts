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

export type CreateBugEntryInput = {
  image_url: string;
  common_name: string;
  category?: string;
  ai_identification?: string;
  confidence_note?: string;
  short_description?: string;
  safety_note?: string;
  location_context?: string;
  date_found?: string;
};

export type UpdateBugEntryInput = {
  common_name?: string;
  category?: string;
  short_description?: string;
  location_context?: string;
  date_found?: string;
  ai_identification?: string;
  confidence_note?: string;
  safety_note?: string;
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

export async function createBugEntry(
  input: CreateBugEntryInput
): Promise<BugEntry> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("Missing access token. Please log in again.");
  }

  const response = await fetch(`${API_BASE_URL}/bug-entries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Create bug entry failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function updateBugEntry(
  id: string,
  input: UpdateBugEntryInput
): Promise<BugEntry> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("Missing access token. Please log in again.");
  }

  const response = await fetch(`${API_BASE_URL}/bug-entries/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Update bug entry failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function deleteBugEntry(id: string): Promise<void> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("Missing access token. Please log in again.");
  }

  const response = await fetch(`${API_BASE_URL}/bug-entries/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Delete bug entry failed: ${response.status} ${errorText}`);
  }
}
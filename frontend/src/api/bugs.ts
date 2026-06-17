import { logoutAndRedirect } from "../utils/auth";
import { API_BASE_URL } from "./client";

function getAccessToken(): string {
  const token = localStorage.getItem("access_token");

  if (!token) {
    logoutAndRedirect();
    throw new Error("Unauthorized");
  }

  return token;
}

function getAuthHeaders() {
  const token = getAccessToken();

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function handleUnauthorized(response: Response) {
  if (response.status === 401) {
    logoutAndRedirect();
    throw new Error("Unauthorized");
  }
}

export async function getPublicBugEntries(): Promise<PublicBugEntry[]> {
  const response = await fetch(`${API_BASE_URL}/public/bug-entries`);

  if (!response.ok) {
    throw new Error("Failed to load public bug entries");
  }

  return response.json();
}

export async function getPublicBugEntry(id: string): Promise<PublicBugEntry> {
  const response = await fetch(`${API_BASE_URL}/public/bug-entries/${id}`);

  if (!response.ok) {
    throw new Error("Failed to load public bug entry");
  }

  return response.json();
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

export type PublicBugEntry = {
  id: string;
  image_url: string;
  common_name: string;
  category: string | null;
  short_description: string | null;
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
  const response = await fetch(`${API_BASE_URL}/bug-entries`, {
    headers: getAuthHeaders(),
  });

  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error("Failed to load bug entries");
  }

  return response.json();
}

export async function getBugEntriesWithoutRedirect(): Promise<BugEntry[]> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("Unauthorized");
  }

  const response = await fetch(`${API_BASE_URL}/bug-entries`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (response.status === 401) {
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    throw new Error("Failed to load bug entries");
  }

  return response.json();
}

export async function getBugEntry(id: string): Promise<BugEntry> {
  const response = await fetch(`${API_BASE_URL}/bug-entries/${id}`, {
    headers: getAuthHeaders(),
  });

  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error("Failed to load bug entry");
  }

  return response.json();
}

export async function createBugEntry(
  input: CreateBugEntryInput
): Promise<BugEntry> {
  const response = await fetch(`${API_BASE_URL}/bug-entries`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });

  handleUnauthorized(response);

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
  const response = await fetch(`${API_BASE_URL}/bug-entries/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });

  handleUnauthorized(response);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Update bug entry failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function deleteBugEntry(id: string): Promise<void> {
  const token = getAccessToken();

  const response = await fetch(`${API_BASE_URL}/bug-entries/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  handleUnauthorized(response);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Delete bug entry failed: ${response.status} ${errorText}`);
  }
}

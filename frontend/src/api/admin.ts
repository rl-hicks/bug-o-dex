import { API_BASE_URL } from "./client";

export type AdminStatus = {
  is_admin: boolean;
  user_id: string;
};

export type EventCount = {
  event_type: string;
  count: number;
};

export type EventSummary = {
  total_event_rows: number;
  event_log_size_bytes: number;
  event_log_size_pretty: string;
  free_storage_reference_bytes: number;
  approx_percent_of_0_5_gb: number;
  counts: EventCount[];
};

export type ContactMessage = {
  id: string;
  name: string | null;
  email: string | null;
  message: string;
  created_at: string;
};

function getAdminHeaders() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("Missing token");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function fetchAdmin<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: getAdminHeaders(),
  });

  if (response.status === 401) {
    throw new Error("Unauthorized");
  }

  if (response.status === 403) {
    throw new Error("Forbidden");
  }

  if (!response.ok) {
    throw new Error("Admin request failed");
  }

  return response.json();
}

export function getAdminStatus(): Promise<AdminStatus> {
  return fetchAdmin<AdminStatus>("/admin/status");
}

export function getEventSummary(): Promise<EventSummary> {
  return fetchAdmin<EventSummary>("/admin/event-summary");
}

export function getContactMessages(): Promise<ContactMessage[]> {
  return fetchAdmin<ContactMessage[]>("/admin/contact-messages");
}

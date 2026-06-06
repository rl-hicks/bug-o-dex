import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import type { BugEntry } from "../api/bugs";
import { getBugEntry } from "../api/bugs";

export function BugDetailPage() {
  const { id } = useParams();

  const [bugEntry, setBugEntry] = useState<BugEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadBugEntry() {
      if (!id) {
        setErrorMessage("Missing bug entry ID.");
        setIsLoading(false);
        return;
      }

      try {
        const entry = await getBugEntry(id);
        setBugEntry(entry);
      } catch {
        setErrorMessage("Could not load bug entry.");
      } finally {
        setIsLoading(false);
      }
    }

    loadBugEntry();
  }, [id]);

  if (isLoading) {
    return <p>Loading bug entry...</p>;
  }

  if (errorMessage) {
    return <p>{errorMessage}</p>;
  }

  if (!bugEntry) {
    return <p>Bug entry not found.</p>;
  }

  return (
    <main>
      <Link to="/collection">← Back to collection</Link>

      <h1>{bugEntry.common_name}</h1>

      <img
        src={bugEntry.image_url}
        alt={bugEntry.common_name}
        width="300"
      />

      {bugEntry.category && <p>Category: {bugEntry.category}</p>}
      {bugEntry.date_found && <p>Found: {bugEntry.date_found}</p>}
      {bugEntry.location_context && <p>Location: {bugEntry.location_context}</p>}

      {bugEntry.short_description && (
        <>
          <h2>Description</h2>
          <p>{bugEntry.short_description}</p>
        </>
      )}

      {bugEntry.ai_identification && (
        <>
          <h2>AI Identification</h2>
          <p>{bugEntry.ai_identification}</p>
        </>
      )}

      {bugEntry.confidence_note && (
        <>
          <h2>Confidence</h2>
          <p>{bugEntry.confidence_note}</p>
        </>
      )}

      {bugEntry.safety_note && (
        <>
          <h2>Safety Note</h2>
          <p>{bugEntry.safety_note}</p>
        </>
      )}
    </main>
  );
}
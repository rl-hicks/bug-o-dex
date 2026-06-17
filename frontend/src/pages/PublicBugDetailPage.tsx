import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getPublicBugEntry, type PublicBugEntry } from "../api/bugs";

export function PublicBugDetailPage() {
  const { id } = useParams();

  const [bugEntry, setBugEntry] = useState<PublicBugEntry | null>(null);
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
        const entry = await getPublicBugEntry(id);
        setBugEntry(entry);
      } catch {
        setErrorMessage("Bug entry not found.");
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
    return (
      <main style={{ padding: "2rem", maxWidth: "720px" }}>
        <p>{errorMessage}</p>
        <p>
          <Link to="/collection">Back to collection</Link>
        </p>
      </main>
    );
  }

  if (!bugEntry) {
    return (
      <main style={{ padding: "2rem", maxWidth: "720px" }}>
        <p>Bug entry not found.</p>
        <p>
          <Link to="/collection">Back to collection</Link>
        </p>
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem", maxWidth: "720px" }}>
      <Link to="/collection">← Back to example collection</Link>

      <h1>{bugEntry.common_name}</h1>

      <img src={bugEntry.image_url} alt={bugEntry.common_name} width="300" />

      {bugEntry.category && <p>Category: {bugEntry.category}</p>}
      {bugEntry.date_found && <p>Found: {bugEntry.date_found}</p>}

      {bugEntry.short_description && (
        <>
          <h2>Description</h2>
          <p>{bugEntry.short_description}</p>
        </>
      )}

      <p>
        This is a read-only public example entry.{" "}
        <Link to="/login">Log in</Link> to upload and manage a private
        Bug-O-Dex collection.
      </p>
    </main>
  );
}
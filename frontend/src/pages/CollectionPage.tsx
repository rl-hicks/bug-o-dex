import { useEffect, useState } from "react";

import type { BugEntry } from "../api/bugs";
import { getBugEntries } from "../api/bugs";

import { Link } from "react-router-dom";

export function CollectionPage() {
  const [bugEntries, setBugEntries] = useState<BugEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadBugEntries() {
      try {
        const entries = await getBugEntries();
        setBugEntries(entries);
      } catch {
        setErrorMessage("Could not load bug entries.");
      } finally {
        setIsLoading(false);
      }
    }

    loadBugEntries();
  }, []);

  if (isLoading) {
    return <p>Loading collection...</p>;
  }

  if (errorMessage) {
    return <p>{errorMessage}</p>;
  }

  if (bugEntries.length === 0) {
    return <p>No bugs collected yet.</p>;
  }

  return (
    <main>
      <h1>Bug-O-Dex Collection</h1>

      <div>
        {bugEntries.map((bug) => (
            <Link
                key={bug.id}
                to={`/bug-entries/${bug.id}`}
            >
                <article>
                <img
                    src={bug.image_url}
                    alt={bug.common_name}
                    width="200"
                />

                <h2>{bug.common_name}</h2>

                {bug.category && (
                    <p>Category: {bug.category}</p>
                )}

                {bug.date_found && (
                    <p>Found: {bug.date_found}</p>
                )}
                </article>
            </Link>
        ))}
      </div>
    </main>
  );
}
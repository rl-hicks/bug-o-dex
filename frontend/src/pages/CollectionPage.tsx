import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import type { BugEntry, PublicBugEntry } from "../api/bugs";
import { getBugEntries, getPublicBugEntries } from "../api/bugs";

type CollectionEntry = BugEntry | PublicBugEntry;

export function CollectionPage() {
  const [bugEntries, setBugEntries] = useState<CollectionEntry[]>([]);
  const [isPublicMode, setIsPublicMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadBugEntries() {
      const token = localStorage.getItem("access_token");

      try {
        if (token) {
          const entries = await getBugEntries();
          setBugEntries(entries);
          setIsPublicMode(false);
        } else {
          const entries = await getPublicBugEntries();
          setBugEntries(entries);
          setIsPublicMode(true);
        }
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
    return (
      <main>
        <h1>{isPublicMode ? "Example Bug-O-Dex Collection" : "My Collection"}</h1>
        <p>{errorMessage}</p>
        <p>
          <Link to="/">Return home</Link>
        </p>
      </main>
    );
  }

  if (bugEntries.length === 0) {
    return (
      <main>
        <h1>{isPublicMode ? "Example Bug-O-Dex Collection" : "My Collection"}</h1>

        {isPublicMode ? (
          <>
            <p>No public bugs are available yet.</p>
            <p>
              <Link to="/login">Log in to manage your own collection</Link>
            </p>
          </>
        ) : (
          <>
            <p>No bugs found yet.</p>
            <p>
              <Link to="/upload">Upload your first bug</Link>
            </p>
          </>
        )}
      </main>
    );
  }

  return (
    <main>
      <h1>{isPublicMode ? "Example Bug-O-Dex Collection" : "My Collection"}</h1>

      {isPublicMode ? (
        <p>
          A read-only sample from the developer&apos;s Bug-O-Dex.{" "}
          <Link to="/login">Log in</Link> to upload and manage your own private
          collection.
        </p>
      ) : (
        <p>
          <Link to="/upload">Upload new bug</Link>
        </p>
      )}

      <div>
        {bugEntries.map((bug) => (
          <Link
            key={bug.id}
            to={
              isPublicMode
                ? `/public/bug-entries/${bug.id}`
                : `/bug-entries/${bug.id}`
            }
          >
            <article>
              <img src={bug.image_url} alt={bug.common_name} width="200" />

              <h2>{bug.common_name}</h2>

              {bug.category && <p>Category: {bug.category}</p>}

              {bug.date_found && <p>Found: {bug.date_found}</p>}
            </article>
          </Link>
        ))}
      </div>
    </main>
  );
}
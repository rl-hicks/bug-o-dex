import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import type { BugEntry, PublicBugEntry } from "../api/bugs";
import {
  getBugEntriesWithoutRedirect,
  getPublicBugEntries,
} from "../api/bugs";

import "./CollectionPage.css";

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
          try {
            const entries = await getBugEntriesWithoutRedirect();
            setBugEntries(entries);
            setIsPublicMode(false);
            return;
          } catch {
            localStorage.removeItem("access_token");

            const publicEntries = await getPublicBugEntries();
            setBugEntries(publicEntries);
            setIsPublicMode(true);
            return;
          }
        }

        const entries = await getPublicBugEntries();
        setBugEntries(entries);
        setIsPublicMode(true);
      } catch {
        setErrorMessage("Could not load bug entries.");
      } finally {
        setIsLoading(false);
      }
    }

    loadBugEntries();
  }, []);

  const title = isPublicMode ? "Example Bug-O-Dex Collection" : "My Collection";

  if (isLoading) {
    return (
      <main className="collection-page">
        <p className="collection-status">Loading collection...</p>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="collection-page">
        <section className="collection-header">
          <p className="collection-eyebrow">
            {isPublicMode ? "Public vault" : "Private vault"}
          </p>

          <h2>{title}</h2>

          <p className="collection-description">{errorMessage}</p>

          <Link className="collection-button secondary" to="/">
            Return home
          </Link>
        </section>
      </main>
    );
  }

  if (bugEntries.length === 0) {
    return (
      <main className="collection-page">
        <section className="collection-header">
          <p className="collection-eyebrow">
            {isPublicMode ? "Public vault" : "Private vault"}
          </p>

          <h2>{title}</h2>

          {isPublicMode ? (
            <>
              <p className="collection-description">
                No public bugs are available yet.
              </p>

              <Link className="collection-button secondary" to="/login">
                Log in to manage your own collection
              </Link>
            </>
          ) : (
            <>
              <p className="collection-description">No bugs found yet.</p>

              <Link className="collection-button primary" to="/upload">
                Upload your first bug
              </Link>
            </>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="collection-page">
      <section className="collection-header">
        <p className="collection-eyebrow">
          {isPublicMode ? "Public vault" : "Private vault"}
        </p>

        <h2>{title}</h2>

        {isPublicMode ? (
          <p className="collection-description">
            A read-only sample from the developer&apos;s Bug-O-Dex.{" "}
            <Link to="/login">Log in</Link> to upload and manage your own
            private collection.
          </p>
        ) : (
          <p className="collection-description">
            Your saved bug discoveries are listed below.
          </p>
        )}

        {!isPublicMode && (
          <Link className="collection-button primary" to="/upload">
            Upload new bug
          </Link>
        )}
      </section>

      <section className="collection-grid" aria-label="Bug collection">
        {bugEntries.map((bug) => (
          <Link
            className="collection-card"
            key={bug.id}
            to={
              isPublicMode
                ? `/public/bug-entries/${bug.id}`
                : `/bug-entries/${bug.id}`
            }
          >
            <img
              className="collection-card-image"
              src={bug.image_url}
              alt={bug.common_name}
            />

            <div className="collection-card-body">
              <h3>{bug.common_name}</h3>

              <div className="collection-card-meta">
                {bug.category && <span>{bug.category}</span>}
                {bug.date_found && <span>Found {bug.date_found}</span>}
              </div>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}

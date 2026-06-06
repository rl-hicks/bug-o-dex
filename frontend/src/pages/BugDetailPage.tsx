import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  deleteBugEntry,
  getBugEntry,
  updateBugEntry,
  type BugEntry,
} from "../api/bugs";

export function BugDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [bugEntry, setBugEntry] = useState<BugEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [commonName, setCommonName] = useState("");
  const [category, setCategory] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [locationContext, setLocationContext] = useState("");
  const [dateFound, setDateFound] = useState("");
  const [aiIdentification, setAiIdentification] = useState("");
  const [confidenceNote, setConfidenceNote] = useState("");
  const [safetyNote, setSafetyNote] = useState("");

  function populateForm(entry: BugEntry) {
    setCommonName(entry.common_name ?? "");
    setCategory(entry.category ?? "");
    setShortDescription(entry.short_description ?? "");
    setLocationContext(entry.location_context ?? "");
    setDateFound(entry.date_found ?? "");
    setAiIdentification(entry.ai_identification ?? "");
    setConfidenceNote(entry.confidence_note ?? "");
    setSafetyNote(entry.safety_note ?? "");
  }

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
        populateForm(entry);
      } catch {
        setErrorMessage("Could not load bug entry.");
      } finally {
        setIsLoading(false);
      }
    }

    loadBugEntry();
  }, [id]);

  async function handleSaveChanges(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!id) {
      setStatusMessage("Missing bug entry ID.");
      return;
    }

    if (!commonName.trim()) {
      setStatusMessage("Common name is required.");
      return;
    }

    setIsSaving(true);
    setStatusMessage("Saving changes...");

    try {
      const updatedEntry = await updateBugEntry(id, {
        common_name: commonName.trim(),
        category: category.trim() || undefined,
        short_description: shortDescription.trim() || undefined,
        location_context: locationContext.trim() || undefined,
        date_found: dateFound || undefined,
        ai_identification: aiIdentification.trim() || undefined,
        confidence_note: confidenceNote.trim() || undefined,
        safety_note: safetyNote.trim() || undefined,
      });

      setBugEntry(updatedEntry);
      populateForm(updatedEntry);
      setIsEditing(false);
      setStatusMessage("Changes saved.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown update error.";
      setStatusMessage(message);
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancelEdit() {
    if (bugEntry) {
      populateForm(bugEntry);
    }

    setIsEditing(false);
    setStatusMessage(null);
  }

  async function handleDelete() {
    if (!id) {
      setStatusMessage("Missing bug entry ID.");
      return;
    }

    const confirmed = window.confirm(
      "Delete this bug entry? This cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setStatusMessage("Deleting bug entry...");

    try {
      await deleteBugEntry(id);
      navigate("/collection");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown delete error.";
      setStatusMessage(message);
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return <p>Loading bug entry...</p>;
  }

  if (errorMessage) {
    return <p>{errorMessage}</p>;
  }

  if (!bugEntry) {
    return <p>Bug entry not found.</p>;
  }

  if (isEditing) {
    return (
      <main style={{ padding: "2rem", maxWidth: "720px" }}>
        <Link to="/collection">← Back to collection</Link>

        <h1>Edit Bug Entry</h1>

        <img
          src={bugEntry.image_url}
          alt={bugEntry.common_name}
          width="300"
          style={{ display: "block", marginBottom: "1rem" }}
        />

        <form onSubmit={handleSaveChanges}>
          <div style={{ marginBottom: "1rem" }}>
            <label>
              Common name *
              <br />
              <input
                type="text"
                value={commonName}
                onChange={(event) => setCommonName(event.target.value)}
              />
            </label>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label>
              Category
              <br />
              <input
                type="text"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              />
            </label>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label>
              Description
              <br />
              <textarea
                value={shortDescription}
                onChange={(event) => setShortDescription(event.target.value)}
                rows={4}
                style={{ width: "100%" }}
              />
            </label>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label>
              Location context
              <br />
              <input
                type="text"
                value={locationContext}
                onChange={(event) => setLocationContext(event.target.value)}
                style={{ width: "100%" }}
              />
            </label>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label>
              Date found
              <br />
              <input
                type="date"
                value={dateFound}
                onChange={(event) => setDateFound(event.target.value)}
              />
            </label>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label>
              AI identification
              <br />
              <textarea
                value={aiIdentification}
                onChange={(event) => setAiIdentification(event.target.value)}
                rows={3}
                style={{ width: "100%" }}
              />
            </label>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label>
              Confidence note
              <br />
              <textarea
                value={confidenceNote}
                onChange={(event) => setConfidenceNote(event.target.value)}
                rows={3}
                style={{ width: "100%" }}
              />
            </label>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label>
              Safety note
              <br />
              <textarea
                value={safetyNote}
                onChange={(event) => setSafetyNote(event.target.value)}
                rows={3}
                style={{ width: "100%" }}
              />
            </label>
          </div>

          <button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save changes"}
          </button>

          <button
            type="button"
            onClick={handleCancelEdit}
            disabled={isSaving}
            style={{ marginLeft: "0.5rem" }}
          >
            Cancel
          </button>
        </form>

        {statusMessage && <p>{statusMessage}</p>}
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem", maxWidth: "720px" }}>
      <Link to="/collection">← Back to collection</Link>

      <h1>{bugEntry.common_name}</h1>

      <img
        src={bugEntry.image_url}
        alt={bugEntry.common_name}
        width="300"
        style={{ display: "block", marginBottom: "1rem" }}
      />

      <div style={{ marginBottom: "1rem" }}>
        <button type="button" onClick={() => setIsEditing(true)}>
          Edit
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          style={{ marginLeft: "0.5rem" }}
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      {statusMessage && <p>{statusMessage}</p>}

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

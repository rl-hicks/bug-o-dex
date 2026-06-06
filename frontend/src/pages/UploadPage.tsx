import { useEffect, useState } from "react";
import { createBugEntry } from "../api/bugs";
import { identifyBug, type IdentifyResponse } from "../api/identify";
import { uploadImage } from "../api/uploads";

export function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const [locationContext, setLocationContext] = useState<string>("");
  const [dateFound, setDateFound] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [identifyResult, setIdentifyResult] = useState<IdentifyResponse | null>(
    null
  );

  const [status, setStatus] = useState<string>("Select a bug photo to begin.");
  const [isIdentifying, setIsIdentifying] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [createdEntryId, setCreatedEntryId] = useState<string>("");

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    setUploadedImageUrl("");
    setIdentifyResult(null);
    setCreatedEntryId("");

    if (!file) {
      setSelectedFile(null);
      setStatus("Select a bug photo to begin.");
      return;
    }

    setSelectedFile(file);
    setStatus(`Selected: ${file.name}`);
  }

  async function handleIdentify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setStatus("Select a bug photo first.");
      return;
    }

    if (!locationContext.trim()) {
      setStatus("Add approximate location/context.");
      return;
    }

    setIsIdentifying(true);
    setStatus("Uploading image...");
    setUploadedImageUrl("");
    setIdentifyResult(null);
    setCreatedEntryId("");

    try {
      const uploadResult = await uploadImage(selectedFile);
      setUploadedImageUrl(uploadResult.image_url);

      setStatus("Image uploaded. Identifying bug...");

      const result = await identifyBug({
        image_url: uploadResult.image_url,
        location_context: locationContext.trim(),
        date_found: dateFound || undefined,
        notes: notes.trim() || undefined,
      });

      setIdentifyResult(result);
      setStatus("Identification complete. Review the result before saving.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown upload/identify error.";
      setStatus(message);
    } finally {
      setIsIdentifying(false);
    }
  }

  async function handleSave() {
    if (!uploadedImageUrl || !identifyResult) {
      setStatus("Run identification before saving.");
      return;
    }

    setIsSaving(true);
    setStatus("Saving bug entry...");
    setCreatedEntryId("");

    try {
      const createdEntry = await createBugEntry({
        image_url: uploadedImageUrl,
        common_name: identifyResult.common_name,
        category: identifyResult.category,
        short_description: identifyResult.short_description,
        confidence_note: identifyResult.confidence_note,
        safety_note: identifyResult.safety_note,
        location_context: locationContext.trim() || undefined,
        date_found: dateFound || undefined,
        ai_identification: `AI best guess: ${identifyResult.common_name}. ${identifyResult.best_guess_disclaimer}`,
      });

      setCreatedEntryId(createdEntry.id);
      setStatus("Bug entry saved to collection.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown save error.";
      setStatus(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRetry() {
    if (!uploadedImageUrl) {
      setStatus("Upload an image before retrying identification.");
      return;
    }

    if (!locationContext.trim()) {
      setStatus("Add approximate location/context.");
      return;
    }

    setIsIdentifying(true);
    setStatus("Retrying identification...");
    setIdentifyResult(null);
    setCreatedEntryId("");

    try {
      const result = await identifyBug({
        image_url: uploadedImageUrl,
        location_context: locationContext.trim(),
        date_found: dateFound || undefined,
        notes: notes.trim() || undefined,
      });

      setIdentifyResult(result);
      setStatus("Identification complete. Review the result before saving.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown retry error.";
      setStatus(message);
    } finally {
      setIsIdentifying(false);
    }
  }

  return (
    <main style={{ padding: "2rem", maxWidth: "720px" }}>
      <h1>Upload Bug</h1>

      <p>
        Add a bug photo and basic discovery context. This is the real E1 upload
        intake page.
      </p>

      <form onSubmit={handleIdentify}>
        <div style={{ marginBottom: "1rem" }}>
          <label>
            Bug photo *
            <br />
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
            />
          </label>
        </div>

        {previewUrl && (
          <div style={{ marginBottom: "1rem" }}>
            <h2>Preview</h2>
            <img
              src={previewUrl}
              alt="Selected bug preview"
              style={{
                maxWidth: "100%",
                width: "320px",
                borderRadius: "12px",
                display: "block",
              }}
            />
          </div>
        )}

        <div style={{ marginBottom: "1rem" }}>
          <label>
            Approximate location/context *
            <br />
            <input
              type="text"
              value={locationContext}
              onChange={(event) => setLocationContext(event.target.value)}
              placeholder="Backyard, creek trail, sidewalk, garden..."
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
            Optional notes
            <br />
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Where was it? What was it doing? Any size/color clues?"
              rows={4}
              style={{ width: "100%" }}
            />
          </label>
        </div>

        <button type="submit" disabled={isIdentifying || isSaving}>
          {isIdentifying ? "Identifying..." : "Identify Bug"}
        </button>
      </form>

      <p style={{ marginTop: "1rem" }}>{status}</p>

      {uploadedImageUrl && !identifyResult && (
        <div style={{ marginTop: "1rem" }}>
          <h2>Uploaded image_url</h2>
          <p style={{ wordBreak: "break-all" }}>{uploadedImageUrl}</p>

          <img
            src={uploadedImageUrl}
            alt="Uploaded bug"
            style={{
              maxWidth: "100%",
              width: "320px",
              borderRadius: "12px",
              display: "block",
            }}
          />
        </div>
      )}

      {identifyResult && uploadedImageUrl && (
        <section style={{ marginTop: "2rem" }}>
          <h2>Review AI Result</h2>

          <img
            src={uploadedImageUrl}
            alt="Uploaded bug"
            style={{
              maxWidth: "100%",
              width: "320px",
              borderRadius: "12px",
              display: "block",
              marginBottom: "1rem",
            }}
          />

          <p>
            <strong>Likely common name:</strong> {identifyResult.common_name}
          </p>

          <p>
            <strong>Category:</strong> {identifyResult.category}
          </p>

          <p>
            <strong>Description:</strong> {identifyResult.short_description}
          </p>

          <p>
            <strong>Confidence:</strong> {identifyResult.confidence_note}
          </p>

          <p>
            <strong>Safety note:</strong> {identifyResult.safety_note}
          </p>

          <p>
            <strong>Disclaimer:</strong> {identifyResult.best_guess_disclaimer}
          </p>

          <button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </button>

          <button
            type="button"
            onClick={handleRetry}
            disabled={isIdentifying || isSaving}
            style={{ marginLeft: "0.5rem" }}
          >
            {isIdentifying ? "Retrying..." : "Retry"}
          </button>
        </section>
      )}

      {createdEntryId && (
        <div style={{ marginTop: "1rem" }}>
          <p>Saved to collection.</p>

          <p>
            <a href="/collection">Open collection</a>
          </p>

          <p>
            <a href={`/bug-entries/${createdEntryId}`}>Open detail page</a>
          </p>
        </div>
      )}
    </main>
  );
}

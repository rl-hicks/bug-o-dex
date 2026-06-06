import { useEffect, useState } from "react";
import { createBugEntry } from "../api/bugs";
import { uploadImage } from "../api/uploads";

export function CreateBugPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const [commonName, setCommonName] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [locationContext, setLocationContext] = useState<string>("");
  const [dateFound, setDateFound] = useState<string>("");

  const [status, setStatus] = useState<string>("Select a bug photo.");
  const [createdEntryId, setCreatedEntryId] = useState<string>("");

  const [isSaving, setIsSaving] = useState<boolean>(false);

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

    setCreatedEntryId("");

    if (!file) {
      setSelectedFile(null);
      setStatus("Select a bug photo.");
      return;
    }

    setSelectedFile(file);
    setStatus(`Selected: ${file.name}`);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setStatus("Select an image first.");
      return;
    }

    if (!commonName.trim()) {
      setStatus("Common name is required.");
      return;
    }

    setIsSaving(true);
    setStatus("Uploading image and saving bug entry...");
    setCreatedEntryId("");

    try {
      const uploadResult = await uploadImage(selectedFile);

      const createdEntry = await createBugEntry({
        image_url: uploadResult.image_url,
        common_name: commonName.trim(),
        category: category.trim() || undefined,
        location_context: locationContext.trim() || undefined,
        date_found: dateFound || undefined,

        ai_identification: "Manual test entry before AI identification.",
        confidence_note: "Manual test entry.",
        short_description: "A test bug entry created with a real uploaded image.",
        safety_note: "Look but do not touch unknown bugs.",
      });

      setCreatedEntryId(createdEntry.id);
      setStatus("Bug entry created successfully.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown create-entry error.";
      setStatus(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main style={{ padding: "2rem", maxWidth: "720px" }}>
      <h1>Create Bug Entry</h1>

      <p>
        Temporary E1 page: upload a real image, save its image_url on a bug
        entry, then verify it appears in the collection and detail page.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label>
            Bug photo
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
            Common name *
            <br />
            <input
              type="text"
              value={commonName}
              onChange={(event) => setCommonName(event.target.value)}
              placeholder="Ladybug"
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
              placeholder="Beetle"
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
              placeholder="Backyard"
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

        <button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Create bug entry"}
        </button>
      </form>

      <p style={{ marginTop: "1rem" }}>{status}</p>

      {createdEntryId && (
        <div style={{ marginTop: "1rem" }}>
          <p>Created entry ID:</p>
          <p style={{ wordBreak: "break-all" }}>{createdEntryId}</p>

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
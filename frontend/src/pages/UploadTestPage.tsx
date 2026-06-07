import { useEffect, useState } from "react";
import { uploadImage } from "../api/uploads";

export function UploadTestPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [status, setStatus] = useState<string>("Choose an image to upload.");
  const [isUploading, setIsUploading] = useState<boolean>(false);

  useEffect(() => {
    if (!previewUrl) {
      return;
    }

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    setUploadedImageUrl("");

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl("");
      setStatus("Choose an image to upload.");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStatus(`Selected: ${file.name}`);
  }

  async function handleUpload() {
    if (!selectedFile) {
      setStatus("Select an image first.");
      return;
    }

    setIsUploading(true);
    setStatus("Uploading image...");
    setUploadedImageUrl("");

    try {
      const result = await uploadImage(selectedFile);
      setUploadedImageUrl(result.image_url);
      setStatus("Upload successful.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown upload error.";
      setStatus(message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <main style={{ padding: "2rem", maxWidth: "720px" }}>
      <h1>Upload Test</h1>

      <p>
        This page tests image selection, local preview, upload to the backend,
        and returned image_url.
      </p>

      <div style={{ marginBottom: "1rem" }}>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
        />
      </div>

      {previewUrl && (
        <div style={{ marginBottom: "1rem" }}>
          <h2>Local Preview</h2>
          <img
            src={previewUrl}
            alt="Selected upload preview"
            style={{
              maxWidth: "100%",
              width: "320px",
              borderRadius: "12px",
              display: "block",
            }}
          />
        </div>
      )}

      <button onClick={handleUpload} disabled={!selectedFile || isUploading}>
        {isUploading ? "Uploading..." : "Upload image"}
      </button>

      <p style={{ marginTop: "1rem" }}>{status}</p>

      {uploadedImageUrl && (
        <div style={{ marginTop: "1rem" }}>
          <h2>Returned image_url</h2>

          <p style={{ wordBreak: "break-all" }}>{uploadedImageUrl}</p>

          <img
            src={uploadedImageUrl}
            alt="Uploaded result"
            style={{
              maxWidth: "100%",
              width: "320px",
              borderRadius: "12px",
              display: "block",
            }}
          />
        </div>
      )}
    </main>
  );
}

"use client";

import { useState } from "react";

/**
 * A client component that renders a form for creating shortened URLs.
 *
 * Users can specify a custom ID (the path part after the domain),
 * upload a loading image (e.g. a GIF) that will be displayed
 * while visitors are redirected, and provide separate destination
 * URLs for mobile and desktop visitors. The form is submitted
 * using the Fetch API to the `/api/create` route. Upon success
 * the component displays the newly created short link.
 */
export default function CreateForm() {
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setShortUrl(null);
    setError(null);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/create", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to create link");
      } else {
        setShortUrl(data.shortUrl);
      }
    } catch (err) {
      setError("Network error while creating link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "2rem auto",
        padding: "1rem",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <h1 style={{ textAlign: "center" }}>Create a Short URL</h1>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="id" style={{ display: "block", marginBottom: "0.5rem" }}>
            Custom ID
          </label>
          <input
            type="text"
            id="id"
            name="id"
            required
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="image" style={{ display: "block", marginBottom: "0.5rem" }}>
            Loading Image (GIF)
          </label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            required
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="mobile" style={{ display: "block", marginBottom: "0.5rem" }}>
            Mobile URL
          </label>
          <input
            type="url"
            id="mobile"
            name="mobile"
            placeholder="https://example.com/mobile"
            required
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="desktop" style={{ display: "block", marginBottom: "0.5rem" }}>
            Desktop URL
          </label>
          <input
            type="url"
            id="desktop"
            name="desktop"
            placeholder="https://example.com/desktop"
            required
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{ padding: "0.75rem 1.5rem", fontSize: "1rem" }}
        >
          {loading ? "Creating..." : "Create Short URL"}
        </button>
      </form>
      {shortUrl && (
        <p style={{ marginTop: "1rem", textAlign: "center" }}>
          Your short URL: <a href={shortUrl}>{shortUrl}</a>
        </p>
      )}
      {error && (
        <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>
      )}
    </div>
  );
}
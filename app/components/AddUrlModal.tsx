// components/AddUrlModal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface AddUrlModalProps {
  onClose: () => void;
  onCreated: () => void;
}

/**
 * AddUrlModal
 * - Renders via a portal directly under <body> so the overlay always spans the full viewport.
 * - Locks background scroll while open.
 * - Centers the card with a full-viewport flex wrapper.
 */
export default function AddUrlModal({ onClose, onCreated }: AddUrlModalProps) {
  const [id, setId] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [urlMobile, setUrlMobile] = useState("");
  const [urlDesktop, setUrlDesktop] = useState("");
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Mount flag for portal (avoids SSR mismatch)
    setMounted(true);

    // Lock background scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Close on ESC
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!id.trim() || !urlMobile.trim()) {
      setError("Custom ID and Mobile URL are required.");
      return;
    }
    if (!imageFile) {
      setError("Please choose an image (GIF/PNG/JPG).");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("id", id.trim());
      formData.append("image", imageFile);
      formData.append("urlMobile", urlMobile.trim());
      formData.append("urlDesktop", urlDesktop.trim());

      const res = await fetch("/api/create", { method: "POST", body: formData });
      if (res.ok) {
        await res.json(); // if you use the response elsewhere, keep it
        onCreated();

        // Clear form
        setId("");
        setImageFile(null);
        setUrlMobile("");
        setUrlDesktop("");
        if (fileInputRef.current) fileInputRef.current.value = "";

        onClose();
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || "Failed to create link");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    }
  }

  // The actual modal UI
  const modal = (
    // Full-screen overlay (no padding here)
    <div
      className="fixed inset-0 z-[9999] bg-black/50"
      role="dialog"
      aria-modal="true"
      onClick={onClose} // click outside to close
    >
      {/* Centering wrapper with spacing */}
      <div
        className="flex lg:h-screen w-screen items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()} // prevent overlay click
      >
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md animate-fade-in mt-20 lg:mt-0">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-6 py-4 flex justify-between items-center rounded-t-lg">
            <h2 className="text-lg font-semibold text-white">Add Link</h2>
            <button
              onClick={onClose}
              className="text-white/90 hover:text-white transition"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            <div>
              <label
                htmlFor="id"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Image Name
              </label>
              <input
                type="text"
                id="id"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="Enter custom ID"
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Image
              </label>
              <input
                type="file"
                accept="image/gif,image/png,image/jpeg"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files[0]) setImageFile(files[0]);
                }}
                ref={fileInputRef}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label
                htmlFor="urlMobile"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Facebook URL
              </label>
              <input
                type="url"
                id="urlMobile"
                value={urlMobile}
                onChange={(e) => setUrlMobile(e.target.value)}
                placeholder="https://example.com/mobile"
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label
                htmlFor="urlDesktop"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Other URL (optional)
              </label>
              <input
                type="url"
                id="urlDesktop"
                value={urlDesktop}
                onChange={(e) => setUrlDesktop(e.target.value)}
                placeholder="https://example.com/desktop"
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {error && <div className="text-red-600 text-sm">{error}</div>}

            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:opacity-90 text-white px-4 py-2 rounded-md shadow transition-opacity duration-200"
              >
                Submit
              </button>
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md"
              >
                Close
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  // Render via portal so the overlay isn't constrained by any transformed ancestor
  if (!mounted) return null;
  return createPortal(modal, document.body);
}

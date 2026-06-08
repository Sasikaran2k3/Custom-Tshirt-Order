"use client";

import { useState, useRef } from "react";

interface ImageUploaderProps {
  onUploaded: (publicId: string, url: string) => void;
}

export default function ImageUploader({ onUploaded }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (file.type !== "image/png") {
      setError("Only PNG files are allowed.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File must be under 10 MB.");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Upload failed");
      }

      const { publicId, url } = await res.json();
      onUploaded(publicId, url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-2">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-300 rounded p-6 text-center cursor-pointer hover:border-gray-400"
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <p className="text-gray-500">Uploading...</p>
        ) : (
          <p className="text-gray-500">
            Drop a PNG here, or <span className="text-blue-600 underline">browse</span>
            <br />
            <span className="text-xs">(PNG only, max 10 MB)</span>
          </p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png"
        className="hidden"
        onChange={handleChange}
      />
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}

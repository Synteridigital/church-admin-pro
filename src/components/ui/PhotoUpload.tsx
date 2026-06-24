"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, X, AlertCircle, ImageIcon } from "lucide-react";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type Props = {
  /** Current photo URL (for existing members) */
  value: string | null;
  /** Called with the new public URL (or null if removed) */
  onChange: (url: string | null) => void;
  /** Storage path prefix, e.g. "{org_id}/{member_id}" */
  storagePath?: string;
};

type UploadState = "idle" | "uploading" | "error" | "done";

export function PhotoUpload({ value, onChange, storagePath }: Props) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>(value ? "done" : "idle");
  const [preview, setPreview] = useState<string | null>(value);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const upload = useCallback(
    async (file: File) => {
      // Client-side validation
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setErrorMsg("Only JPG, PNG, and WebP images are allowed.");
        setState("error");
        return;
      }
      if (file.size > MAX_SIZE) {
        setErrorMsg("Image must be smaller than 5 MB.");
        setState("error");
        return;
      }

      setErrorMsg(null);
      setState("uploading");
      setProgress(0);

      // Generate preview immediately
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      // Determine file path in the bucket
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const ts = Date.now();
      const path = storagePath
        ? `${storagePath}-${ts}.${ext}`
        : `uploads/${ts}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

      // Simulate progress since supabase-js doesn't expose upload progress
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 15, 90));
      }, 200);

      const { error } = await supabase.storage
        .from("member-photos")
        .upload(path, file, { upsert: true });

      clearInterval(progressInterval);

      if (error) {
        setErrorMsg(error.message);
        setState("error");
        setPreview(value);
        URL.revokeObjectURL(objectUrl);
        return;
      }

      setProgress(100);

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("member-photos").getPublicUrl(path);

      URL.revokeObjectURL(objectUrl);
      setPreview(publicUrl);
      onChange(publicUrl);
      setState("done");
    },
    [supabase, storagePath, onChange, value]
  );

  function handleFiles(files: FileList | null) {
    if (files?.[0]) upload(files[0]);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleRemove() {
    setPreview(null);
    onChange(null);
    setState("idle");
    setErrorMsg(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      {/* Preview / Upload zone */}
      {state === "done" && preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Member photo"
            className="h-28 w-28 rounded-2xl object-cover border border-gray-200"
          />
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Remove photo"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-colors ${
            dragOver
              ? "border-gray-400 bg-gray-50"
              : "border-gray-200 bg-white"
          }`}
        >
          {state === "uploading" ? (
            <>
              {preview && (
                <img
                  src={preview}
                  alt=""
                  className="h-16 w-16 rounded-xl object-cover mb-3 opacity-60"
                />
              )}
              <div className="w-40 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all motion-reduce:transition-none"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: "var(--brand)",
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">Uploading…</p>
            </>
          ) : state === "error" ? (
            <>
              <div className="mb-2 rounded-full bg-red-50 p-2.5">
                <AlertCircle
                  size={20}
                  className="text-red-400"
                  aria-hidden="true"
                />
              </div>
              <p className="text-sm text-red-600 text-center mb-2">
                {errorMsg}
              </p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-sm font-medium hover:underline"
                style={{ color: "var(--brand)" }}
              >
                Try again
              </button>
            </>
          ) : (
            <>
              <div className="mb-2 rounded-full bg-gray-100 p-2.5">
                <ImageIcon
                  size={20}
                  className="text-gray-400"
                  aria-hidden="true"
                />
              </div>
              <p className="text-sm text-gray-500 text-center">
                Drag a photo here, or
              </p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-1.5 inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  backgroundColor: "var(--brand)",
                  color: "var(--brand-text)",
                }}
              >
                <Upload size={14} aria-hidden="true" />
                Choose file
              </button>
              <p className="mt-2 text-xs text-gray-400">
                JPG, PNG, or WebP — max 5 MB
              </p>
            </>
          )}
        </div>
      )}

      {/* Hidden file input — keyboard accessible via the visible button */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

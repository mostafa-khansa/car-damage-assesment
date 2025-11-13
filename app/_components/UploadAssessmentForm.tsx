"use client";

import { useState, useMemo, useCallback, useRef, useId } from "react";
import { upload } from "@vercel/blob/client";
import Image from "next/image";

type Damage = { type: string; repairCost: number };

export default function UploadAssessmentForm() {
  const [title, setTitle] = useState("");
  const [totalCost, setTotalCost] = useState<string>("");

  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const [afterUrl, setAfterUrl] = useState<string | null>(null);

  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return title.trim().length > 0 && (beforeUrl || afterUrl) && totalCost !== "";
  }, [title, beforeUrl, afterUrl, totalCost]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!canSubmit) return;

    setSaving(true);
    try {
      const payload = {
        title,
        beforeImageUrl: beforeUrl ?? undefined,
        afterImageUrl: afterUrl ?? undefined,
        totalCost: Number(totalCost),
        damages: [] as Damage[],
      };

      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Failed with ${res.status}`);
      }

      setMessage("Saved successfully.");
      setTitle("");
      setTotalCost("");
      setBeforeUrl(null);
      setAfterUrl(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save";
      setMessage(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h1 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">New Assessment</h1>
      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">Upload one or two images to Vercel Blob, then save.</p>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-800 dark:text-zinc-200">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Assessment 12/1/2023"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400 placeholder:text-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-800 dark:text-zinc-200">Total Cost</label>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={totalCost}
              onChange={(e) => setTotalCost(e.target.value)}
              placeholder="450"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400 placeholder:text-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
            <div className="mb-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">Before Image</div>
            {beforeUrl ? (
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                <Image src={beforeUrl} alt="Before" fill className="object-cover" />
              </div>
            ) : (
              <BlobDropArea
                busy={uploadingBefore}
                onPick={async (file) => {
                  try {
                    setUploadingBefore(true);
                    const result = await upload(file.name, file, {
                      access: "public",
                      handleUploadUrl: "/api/blob/upload",
                      multipart: true,
                    });
                    setBeforeUrl(result.url);
                    setMessage("Image uploaded successfully.");
                  } catch (e: unknown) {
                    const msg = e instanceof Error ? e.message : "Upload failed";
                    setMessage(msg);
                  } finally {
                    setUploadingBefore(false);
                  }
                }}
                label="Drop or click to upload"
              />
            )}
            {beforeUrl && (
              <button
                type="button"
                onClick={() => setBeforeUrl(null)}
                className="mt-3 rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                Replace image
              </button>
            )}
          </div>

          <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
            <div className="mb-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">After Image (optional)</div>
            {afterUrl ? (
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                <Image src={afterUrl} alt="After" fill className="object-cover" />
              </div>
            ) : (
              <BlobDropArea
                busy={uploadingAfter}
                onPick={async (file) => {
                  try {
                    setUploadingAfter(true);
                    const result = await upload(file.name, file, {
                      access: "public",
                      handleUploadUrl: "/api/blob/upload",
                      multipart: true,
                    });
                    setAfterUrl(result.url);
                    setMessage("Image uploaded successfully.");
                  } catch (e: unknown) {
                    const msg = e instanceof Error ? e.message : "Upload failed";
                    setMessage(msg);
                  } finally {
                    setUploadingAfter(false);
                  }
                }}
                label="Drop or click to upload"
              />
            )}
            {afterUrl && (
              <button
                type="button"
                onClick={() => setAfterUrl(null)}
                className="mt-3 rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                Replace image
              </button>
            )}
          </div>
        </div>

        {message && (
          <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            {message}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={!canSubmit || saving}
            className="inline-flex items-center justify-center rounded-full bg-black px-5 py-2 text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {saving ? "Saving..." : "Save Assessment"}
          </button>
        </div>
      </form>
    </div>
  );
}

function BlobDropArea({
  onPick,
  label,
  busy,
}: {
  onPick: (file: File) => void | Promise<void>;
  label: string;
  busy?: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const inputId = useId();

  const onFiles = useCallback(
    (files: FileList | null) => {
      const f = files?.[0];
      if (!f) return;
      if (!f.type.startsWith("image/")) return;
      void onPick(f);
    },
    [onPick]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        onFiles(e.dataTransfer.files);
      }}
      className={`relative flex h-40 items-center justify-center rounded-lg border border-dashed p-4 transition-colors ${
        dragOver
          ? "border-zinc-500 bg-zinc-50 dark:border-zinc-400 dark:bg-zinc-900"
          : "border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
      }`}
    >
      <input
        id={inputId}
        aria-label="Upload image"
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => onFiles(e.currentTarget.files)}
      />
      <label htmlFor={inputId} className="cursor-pointer text-sm text-zinc-600 dark:text-zinc-400">
        {busy ? "Uploading..." : label}
      </label>
    </div>
  );
}

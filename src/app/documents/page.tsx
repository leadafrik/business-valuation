"use client";

import { useEffect, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import {
  Download,
  Eye,
  File,
  FileImage,
  FileText,
  FolderOpen,
  Loader2,
  Search,
  Trash2,
  Upload,
} from "lucide-react";

interface Document {
  id: string;
  name: string;
  url: string;
  type: string | null;
  propertyId: string | null;
  tenantId: string | null;
  uploadedBy: string;
  createdAt: string;
  expiresAt?: string | null;
  property?: { name: string } | null;
  tenant?: { user: { name: string | null } } | null;
}

const TYPE_LABELS: Record<string, string> = {
  lease: "Lease Agreement",
  id: "ID / KYC",
  receipt: "Receipt",
  inspection: "Inspection Report",
  notice: "Notice",
  other: "Other",
};

const TYPE_STYLES: Record<string, string> = {
  lease: "bg-[rgba(10,35,66,0.08)] text-[var(--rf-navy)]",
  id: "bg-[rgba(93,112,127,0.12)] text-[var(--rf-slate)]",
  receipt: "bg-[var(--rf-green-soft)] text-[var(--rf-green)]",
  inspection: "bg-[var(--rf-gold-soft)] text-[#9c660e]",
  notice: "bg-[var(--rf-red-soft)] text-[var(--rf-red)]",
  other: "bg-[rgba(93,112,127,0.1)] text-[var(--rf-slate)]",
};

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext ?? "")) {
    return <FileImage className="h-5 w-5 text-[var(--rf-gold)]" />;
  }
  if (ext === "pdf") {
    return <FileText className="h-5 w-5 text-[var(--rf-red)]" />;
  }

  return <File className="h-5 w-5 text-[var(--rf-slate)]" />;
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({ name: "", type: "other", expiresAt: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocs();
  }, []);

  async function fetchDocs() {
    setLoading(true);
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      setDocs(data.documents ?? []);
    } catch {
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload() {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("name", uploadForm.name || selectedFile.name);
      formData.append("type", uploadForm.type);
      if (uploadForm.expiresAt) {
        formData.append("expiresAt", uploadForm.expiresAt);
      }

      const res = await fetch("/api/documents", { method: "POST", body: formData });
      if (res.ok) {
        setShowUploadModal(false);
        setSelectedFile(null);
        setUploadForm({ name: "", type: "other", expiresAt: "" });
        fetchDocs();
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this document?")) return;

    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    fetchDocs();
  }

  const filtered = docs.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.property?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (d.tenant?.user?.name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || d.type === typeFilter;

    return matchSearch && matchType;
  });

  const grouped = Object.keys(TYPE_LABELS).reduce((acc, type) => {
    const items = filtered.filter((d) => (d.type ?? "other") === type);
    if (items.length) acc[type] = items;
    return acc;
  }, {} as Record<string, Document[]>);

  return (
    <AppShell>
      <TopBar
        title="Documents"
        actions={
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--rf-green)] px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#266a2a]"
          >
            <Upload className="h-4 w-4" />
            Upload document
          </button>
        }
      />

      <div className="space-y-6 p-4 sm:p-6">
        <section className="app-panel rounded-[1.95rem] p-5 sm:p-6">
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--rf-slate)]">
                Document control
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--rf-slate)]">
                Lease agreements, IDs, receipts, notices, and inspection files in one operating view.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1 sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--rf-slate)]" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-2xl border border-[rgba(93,112,127,0.2)] bg-white/90 py-3 pl-10 pr-4 text-sm text-[var(--rf-navy)] outline-none transition focus:border-[rgba(46,125,50,0.34)] focus:ring-4 focus:ring-[rgba(46,125,50,0.08)]"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-2xl border border-[rgba(93,112,127,0.2)] bg-white/90 px-4 py-3 text-sm text-[var(--rf-navy)] outline-none transition focus:border-[rgba(46,125,50,0.34)] focus:ring-4 focus:ring-[rgba(46,125,50,0.08)]"
              >
                <option value="all">All types</option>
                {Object.entries(TYPE_LABELS).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {Object.entries(TYPE_LABELS).map(([key, value]) => {
            const count = docs.filter((d) => (d.type ?? "other") === key).length;
            const active = typeFilter === key;

            return (
              <button
                key={key}
                onClick={() => setTypeFilter(active ? "all" : key)}
                className={`rounded-[1.5rem] border px-4 py-4 text-left transition ${
                  active
                    ? "border-[rgba(46,125,50,0.24)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(233,244,234,0.94))] shadow-[0_16px_30px_-26px_rgba(46,125,50,0.16)]"
                    : "border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,249,250,0.9))] shadow-[0_14px_24px_-24px_rgba(10,35,66,0.08)] hover:-translate-y-0.5 hover:shadow-[0_18px_32px_-28px_rgba(10,35,66,0.12)]"
                }`}
              >
                <p className="text-2xl font-semibold text-[var(--rf-navy)]">{count}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--rf-slate)]">{value}</p>
              </button>
            );
          })}
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--rf-green)]" />
          </div>
        ) : filtered.length === 0 ? (
          <section className="app-panel rounded-[2rem] px-6 py-16 text-center">
            <FolderOpen className="mx-auto mb-3 h-10 w-10 text-[rgba(93,112,127,0.38)]" />
            <p className="font-medium text-[var(--rf-slate)]">No documents found</p>
            <p className="mt-1 text-sm text-[var(--rf-slate)]/80">
              Upload lease agreements, IDs, and other files to keep everything in one place.
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[var(--rf-green)] px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#266a2a]"
            >
              <Upload className="h-4 w-4" />
              Upload your first document
            </button>
          </section>
        ) : typeFilter === "all" ? (
          <div className="space-y-5">
            {Object.entries(grouped).map(([type, items]) => (
              <section
                key={type}
                className="overflow-hidden rounded-[1.85rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,249,250,0.92))] shadow-[0_18px_32px_-28px_rgba(10,35,66,0.08)]"
              >
                <div className="flex items-center gap-2 border-b border-[rgba(93,112,127,0.12)] px-5 py-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      TYPE_STYLES[type] ?? TYPE_STYLES.other
                    }`}
                  >
                    {TYPE_LABELS[type]}
                  </span>
                  <span className="text-xs text-[var(--rf-slate)]">
                    {items.length} file{items.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="divide-y divide-[rgba(93,112,127,0.1)]">
                  {items.map((doc) => (
                    <DocRow key={doc.id} doc={doc} onDelete={handleDelete} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <section className="overflow-hidden rounded-[1.85rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,249,250,0.92))] shadow-[0_18px_32px_-28px_rgba(10,35,66,0.08)]">
            <div className="divide-y divide-[rgba(93,112,127,0.1)]">
              {filtered.map((doc) => (
                <DocRow key={doc.id} doc={doc} onDelete={handleDelete} />
              ))}
            </div>
          </section>
        )}
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[1.8rem] bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[var(--rf-navy)]">Upload Document</h3>
            <div className="mt-4 space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-[1.3rem] border-2 border-dashed p-6 text-center transition-colors ${
                  selectedFile
                    ? "border-[rgba(46,125,50,0.4)] bg-[var(--rf-green-soft)]"
                    : "border-[rgba(93,112,127,0.24)] hover:border-[rgba(93,112,127,0.34)]"
                }`}
              >
                {selectedFile ? (
                  <div>
                    <p className="text-sm font-medium text-[var(--rf-green)]">
                      {selectedFile.name}
                    </p>
                    <p className="mt-1 text-xs text-[var(--rf-slate)]">
                      {(selectedFile.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto mb-2 h-7 w-7 text-[var(--rf-slate)]" />
                    <p className="text-sm text-[var(--rf-slate)]">Click to select a file</p>
                    <p className="mt-1 text-xs text-[var(--rf-slate)]">PDF, JPG, PNG up to 10 MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                      if (!uploadForm.name) {
                        setUploadForm((prev) => ({ ...prev, name: file.name }));
                      }
                    }
                  }}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--rf-slate)]">
                  Document name
                </label>
                <input
                  type="text"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                  placeholder="e.g. Lease Agreement - Unit 4A"
                  className="w-full rounded-2xl border border-[rgba(93,112,127,0.2)] px-3 py-2.5 text-sm text-[var(--rf-navy)] outline-none transition focus:border-[rgba(46,125,50,0.34)] focus:ring-4 focus:ring-[rgba(46,125,50,0.08)]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--rf-slate)]">
                  Document type
                </label>
                <select
                  value={uploadForm.type}
                  onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
                  className="w-full rounded-2xl border border-[rgba(93,112,127,0.2)] px-3 py-2.5 text-sm text-[var(--rf-navy)] outline-none transition focus:border-[rgba(46,125,50,0.34)] focus:ring-4 focus:ring-[rgba(46,125,50,0.08)]"
                >
                  {Object.entries(TYPE_LABELS).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--rf-slate)]">
                  Expiry date
                </label>
                <input
                  type="date"
                  value={uploadForm.expiresAt}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, expiresAt: e.target.value })
                  }
                  className="w-full rounded-2xl border border-[rgba(93,112,127,0.2)] px-3 py-2.5 text-sm text-[var(--rf-navy)] outline-none transition focus:border-[rgba(46,125,50,0.34)] focus:ring-4 focus:ring-[rgba(46,125,50,0.08)]"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setUploadForm({ name: "", type: "other", expiresAt: "" });
                }}
                className="flex-1 rounded-2xl border border-[rgba(93,112,127,0.2)] px-4 py-2.5 text-sm font-medium text-[var(--rf-slate)] transition hover:bg-[rgba(93,112,127,0.06)]"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--rf-green)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#266a2a] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function DocRow({ doc, onDelete }: { doc: Document; onDelete: (id: string) => void }) {
  const expiresAt = doc.expiresAt ? new Date(doc.expiresAt) : null;
  const daysUntilExpiry = expiresAt
    ? Math.ceil((expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : null;
  const expiryTone =
    daysUntilExpiry === null
      ? ""
      : daysUntilExpiry <= 14
      ? "text-[var(--rf-red)]"
      : daysUntilExpiry <= 45
      ? "text-[#9c660e]"
      : "text-[var(--rf-slate)]";

  return (
    <div className="flex items-center gap-4 px-5 py-4 transition hover:bg-[rgba(93,112,127,0.04)]">
      <div className="shrink-0">{fileIcon(doc.name)}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--rf-navy)]">{doc.name}</p>
        <div className="mt-0.5 flex items-center gap-3 text-xs text-[var(--rf-slate)]">
          {doc.property && <span>{doc.property.name}</span>}
          {doc.tenant && <span>{doc.tenant.user.name}</span>}
          <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
          {expiresAt && (
            <span className={expiryTone}>
              Expires {expiresAt.toLocaleDateString()}{" "}
              {daysUntilExpiry !== null ? `(${daysUntilExpiry <= 0 ? "today" : `${daysUntilExpiry}d`})` : ""}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl p-2 text-[var(--rf-slate)] transition hover:bg-[rgba(93,112,127,0.08)] hover:text-[var(--rf-navy)]"
          title="Preview"
        >
          <Eye className="h-4 w-4" />
        </a>
        <a
          href={doc.url}
          download
          className="rounded-xl p-2 text-[var(--rf-slate)] transition hover:bg-[rgba(93,112,127,0.08)] hover:text-[var(--rf-navy)]"
          title="Download"
        >
          <Download className="h-4 w-4" />
        </a>
        <button
          onClick={() => onDelete(doc.id)}
          className="rounded-xl p-2 text-[var(--rf-slate)] transition hover:bg-[var(--rf-red-soft)] hover:text-[var(--rf-red)]"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

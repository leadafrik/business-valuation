"use client";

import { useState, useEffect, useRef } from "react";
import AppShell from "@/components/AppShell";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Search,
  FolderOpen,
  File,
  FileImage,
  Eye,
  Loader2,
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

const TYPE_COLORS: Record<string, string> = {
  lease: "bg-blue-50 text-blue-700",
  id: "bg-purple-50 text-purple-700",
  receipt: "bg-green-50 text-green-700",
  inspection: "bg-amber-50 text-amber-700",
  notice: "bg-red-50 text-red-700",
  other: "bg-slate-100 text-slate-600",
};

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext ?? ""))
    return <FileImage className="w-5 h-5 text-sky-500" />;
  if (ext === "pdf") return <FileText className="w-5 h-5 text-red-500" />;
  return <File className="w-5 h-5 text-slate-400" />;
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({ name: "", type: "other" });
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

      const res = await fetch("/api/documents", { method: "POST", body: formData });
      if (res.ok) {
        setShowUploadModal(false);
        setSelectedFile(null);
        setUploadForm({ name: "", type: "other" });
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

  // Group by type
  const grouped = Object.keys(TYPE_LABELS).reduce((acc, t) => {
    const items = filtered.filter((d) => (d.type ?? "other") === t);
    if (items.length) acc[t] = items;
    return acc;
  }, {} as Record<string, Document[]>);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Lease agreements, IDs, receipts and inspection reports
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All types</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(TYPE_LABELS).map(([k, v]) => {
            const count = docs.filter((d) => (d.type ?? "other") === k).length;
            return (
              <button
                key={k}
                onClick={() => setTypeFilter(typeFilter === k ? "all" : k)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  typeFilter === k
                    ? "border-green-500 bg-green-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <p className="text-xl font-bold text-slate-900">{count}</p>
                <p className="text-xs text-slate-500 mt-0.5">{v}</p>
              </button>
            );
          })}
        </div>

        {/* Document list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
            <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No documents found</p>
            <p className="text-slate-400 text-sm mt-1">
              Upload lease agreements, IDs, and other files to keep everything in one place.
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg"
            >
              Upload your first document
            </button>
          </div>
        ) : typeFilter === "all" ? (
          // Grouped view
          <div className="space-y-6">
            {Object.entries(grouped).map(([type, items]) => (
              <div key={type} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[type]}`}>
                    {TYPE_LABELS[type]}
                  </span>
                  <span className="text-xs text-slate-400">{items.length} file{items.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {items.map((doc) => (
                    <DocRow
                      key={doc.id}
                      doc={doc}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Flat filtered list
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
            {filtered.map((doc) => (
              <DocRow key={doc.id} doc={doc} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Upload Document</h3>
            <div className="space-y-4">
              {/* File drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  selectedFile
                    ? "border-green-400 bg-green-50"
                    : "border-slate-300 hover:border-slate-400"
                }`}
              >
                {selectedFile ? (
                  <div>
                    <p className="text-sm font-medium text-green-700">{selectedFile.name}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {(selectedFile.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">Click to select a file</p>
                    <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG up to 10 MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setSelectedFile(f);
                      if (!uploadForm.name) setUploadForm((prev) => ({ ...prev, name: f.name }));
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Document name
                </label>
                <input
                  type="text"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                  placeholder="e.g. Lease Agreement - Unit 4A"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Document type
                </label>
                <select
                  value={uploadForm.type}
                  onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {Object.entries(TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowUploadModal(false); setSelectedFile(null); }}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                {uploading ? "Uploading…" : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function DocRow({ doc, onDelete }: { doc: Document; onDelete: (id: string) => void }) {
  return (
    <div className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50">
      <div className="shrink-0">{fileIcon(doc.name)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{doc.name}</p>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
          {doc.property && <span>{doc.property.name}</span>}
          {doc.tenant && <span>{doc.tenant.user.name}</span>}
          <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          title="Preview"
        >
          <Eye className="w-4 h-4" />
        </a>
        <a
          href={doc.url}
          download
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          title="Download"
        >
          <Download className="w-4 h-4" />
        </a>
        <button
          onClick={() => onDelete(doc.id)}
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

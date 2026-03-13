"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { FileText, Download, Eye, FolderOpen, Loader2, File, FileImage } from "lucide-react";

interface Document {
  id: string;
  name: string;
  url: string;
  type: string | null;
  createdAt: string;
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

export default function TenantDocumentsPage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tenant/documents")
      .then((r) => r.json())
      .then((d) => setDocs(d.documents ?? []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Documents</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Your lease agreements, receipts, and notices from your landlord
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          </div>
        ) : docs.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
            <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No documents yet</p>
            <p className="text-slate-400 text-sm mt-1">
              Documents shared by your landlord will appear here.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
            {docs.map((doc) => (
              <div key={doc.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50">
                <div className="shrink-0">{fileIcon(doc.name)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{doc.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {doc.type && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          TYPE_COLORS[doc.type] ?? TYPE_COLORS.other
                        }`}
                      >
                        {TYPE_LABELS[doc.type] ?? doc.type}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

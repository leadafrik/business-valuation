"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  Globe,
  Code2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/v1/properties",
    desc: "List all your properties",
    params: ["page", "limit"],
  },
  {
    method: "GET",
    path: "/api/v1/tenants",
    desc: "List all tenants",
    params: ["page", "limit", "propertyId", "status"],
  },
  {
    method: "GET",
    path: "/api/v1/payments",
    desc: "List payment records",
    params: ["page", "limit", "propertyId", "status", "from", "to"],
  },
];

export default function DeveloperSettingsPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [expiresInDays, setExpiresInDays] = useState<string>("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    setLoading(true);
    const res = await fetch("/api/developer/keys");
    const data = await res.json();
    setKeys(data.keys ?? []);
    setLoading(false);
  }

  async function handleCreate() {
    if (!newKeyName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/developer/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newKeyName.trim(),
        expiresInDays: expiresInDays ? parseInt(expiresInDays) : null,
      }),
    });
    const data = await res.json();
    setCreating(false);
    if (data.rawKey) {
      setCreatedKey(data.rawKey);
      setNewKeyName("");
      setExpiresInDays("");
      fetchKeys();
    }
  }

  async function handleRevoke(id: string) {
    setRevoking(id);
    await fetch(`/api/developer/keys/${id}`, { method: "DELETE" });
    setRevoking(null);
    fetchKeys();
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const activeKeys = keys.filter((k) => k.isActive);
  const revokedKeys = keys.filter((k) => !k.isActive);

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Code2 className="w-6 h-6 text-green-600" />
            Developer / API Access
          </h1>
          <p className="text-slate-500 mt-1">
            Use API keys to integrate RentiFlow with your own tools and automation workflows.
          </p>
        </div>

        {/* Base URL banner */}
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 text-slate-200 rounded-lg text-sm font-mono">
          <Globe className="w-4 h-4 text-green-400 shrink-0" />
          <span className="text-slate-400">Base URL:</span>
          <span className="text-white">
            {typeof window !== "undefined" ? window.location.origin : "https://yourdomain.com"}
            /api/v1
          </span>
          <button
            onClick={() =>
              copyToClipboard(
                `${window.location.origin}/api/v1`,
                "baseurl"
              )
            }
            className="ml-auto"
          >
            {copiedId === "baseurl" ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-slate-400 hover:text-white" />
            )}
          </button>
        </div>

        {/* API Keys section */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-slate-500" />
              <h2 className="font-semibold text-slate-900">API Keys</h2>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {activeKeys.length} / 10 active
              </span>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg"
            >
              <Plus className="w-4 h-4" />
              New Key
            </button>
          </div>

          {/* Newly created key banner */}
          {createdKey && (
            <div className="mx-6 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-900">
                    Copy your key now — it won't be shown again
                  </p>
                  <div className="mt-2 flex items-center gap-2 bg-white border border-amber-300 rounded px-3 py-2">
                    <code className="text-sm font-mono text-slate-800 truncate flex-1">
                      {createdKey}
                    </code>
                    <button onClick={() => copyToClipboard(createdKey, "newkey")}>
                      {copiedId === "newkey" ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setCreatedKey(null)}
                className="mt-3 text-xs text-amber-700 underline"
              >
                I've saved it — dismiss
              </button>
            </div>
          )}

          {/* Keys list */}
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="px-6 py-8 text-center text-slate-400 text-sm">
                Loading...
              </div>
            ) : activeKeys.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <Key className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No API keys yet. Create one to get started.</p>
              </div>
            ) : (
              activeKeys.map((k) => (
                <div key={k.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">{k.name}</span>
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-400 font-mono">
                      <span>{k.keyPrefix}••••••••••••••••••••••••</span>
                      {k.lastUsedAt ? (
                        <span>
                          Last used {new Date(k.lastUsedAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span>Never used</span>
                      )}
                      {k.expiresAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expires {new Date(k.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevoke(k.id)}
                    disabled={revoking === k.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {revoking === k.id ? "Revoking…" : "Revoke"}
                  </button>
                </div>
              ))
            )}
          </div>

          {revokedKeys.length > 0 && (
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                {revokedKeys.length} revoked key{revokedKeys.length > 1 ? "s" : ""} hidden
              </p>
            </div>
          )}
        </div>

        {/* Authentication guide */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Authentication</h2>
          </div>
          <div className="px-6 py-4 space-y-3">
            <p className="text-sm text-slate-600">
              Include your API key in every request using the{" "}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">
                X-API-Key
              </code>{" "}
              header:
            </p>
            <div className="bg-slate-800 rounded-lg p-4 font-mono text-xs text-slate-200 space-y-1">
              <div>
                <span className="text-green-400">curl</span>{" "}
                <span className="text-amber-300">
                  {typeof window !== "undefined" ? window.location.origin : "https://yourdomain.com"}
                  /api/v1/properties
                </span>{" "}
                \
              </div>
              <div className="pl-4">
                <span className="text-slate-400">-H</span>{" "}
                <span className="text-sky-300">"X-API-Key: rntf_your_key_here"</span>
              </div>
            </div>
          </div>
        </div>

        {/* Endpoints reference */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => setDocsOpen(!docsOpen)}
            className="w-full flex items-center justify-between px-6 py-4 border-b border-slate-100 hover:bg-slate-50"
          >
            <h2 className="font-semibold text-slate-900">Endpoints Reference</h2>
            {docsOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>
          {docsOpen && (
            <div className="divide-y divide-slate-100">
              {ENDPOINTS.map((ep) => (
                <div key={ep.path} className="px-6 py-4">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded font-mono">
                      {ep.method}
                    </span>
                    <code className="text-sm font-mono text-slate-800">{ep.path}</code>
                  </div>
                  <p className="text-sm text-slate-500 mb-2">{ep.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ep.params.map((p) => (
                      <span
                        key={p}
                        className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono"
                      >
                        ?{p}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              <div className="px-6 py-4 bg-slate-50">
                <p className="text-xs text-slate-500">
                  All endpoints return{" "}
                  <code className="bg-slate-200 px-1 rounded">
                    {"{ data: [], meta: { total, page, limit, totalPages } }"}
                  </code>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create key modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Create API Key</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Key Name
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Google Sheets Integration"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Expiry (optional)
                </label>
                <select
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Never expires</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="365">1 year</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setNewKeyName(""); }}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowModal(false); handleCreate(); }}
                disabled={!newKeyName.trim() || creating}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm disabled:opacity-50"
              >
                {creating ? "Creating…" : "Create Key"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

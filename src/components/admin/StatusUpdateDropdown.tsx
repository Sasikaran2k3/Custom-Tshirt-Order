"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type OrderStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

interface StatusUpdateDropdownProps {
  orderId: string;
  currentStatus: OrderStatus;
  adminNotes?: string | null;
}

const STATUS_OPTIONS: OrderStatus[] = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

export default function StatusUpdateDropdown({
  orderId,
  currentStatus,
  adminNotes,
}: StatusUpdateDropdownProps) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [notes, setNotes] = useState(adminNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes: notes }),
      });

      if (!res.ok) throw new Error("Failed to update");
      setMessage("Saved!");
      router.refresh();
    } catch {
      setMessage("Error saving.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus)}
          className="border border-gray-300 rounded px-3 py-2 text-sm w-full"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Admin Notes (internal)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="border border-gray-300 rounded px-3 py-2 text-sm w-full"
          placeholder="Internal notes visible only to admins..."
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>

      {message && <p className="text-sm text-green-600">{message}</p>}
    </div>
  );
}

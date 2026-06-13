"use client";

import { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import ColorPicker from "@/components/canvas/ColorPicker";
import ImageUploader from "@/components/canvas/ImageUploader";
import CanvasToolbar from "@/components/canvas/CanvasToolbar";
import type { TshirtCanvasHandle } from "@/components/canvas/TshirtCanvas";
import { ShirtColor } from "@/hooks/useCanvas";

const TshirtCanvas = dynamic(() => import("@/components/canvas/TshirtCanvas"), { ssr: false });

export default function DesignPage() {
  const canvasRef = useRef<TshirtCanvasHandle>(null);
  const [color, setColor] = useState<ShirtColor>("white");
  const [imagePublicId, setImagePublicId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [hasDesign, setHasDesign] = useState(false);
  const [objectSelected, setObjectSelected] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleUploaded = useCallback((publicId: string, url: string) => {
    setImagePublicId(publicId);
    setImageUrl(url);
    setHasDesign(true);
    canvasRef.current?.loadDesign(url);
  }, []);

  const handleColorChange = useCallback((newColor: ShirtColor) => {
    setColor(newColor);
    canvasRef.current?.switchColor(newColor);
  }, []);

  async function handlePlaceOrder() {
    if (!imagePublicId || !imageUrl) {
      setError("Please upload a design first.");
      return;
    }

    const placement = canvasRef.current?.getPlacement();
    if (!placement) {
      setError("Could not read design placement.");
      return;
    }

    const canvasState = canvasRef.current?.getCanvasJSON();

    setError("");
    setPlacing(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tshirtColor: color,
          imagePublicId,
          imageUrl,
          canvasState,
          ...placement,
          notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to place order");
      }

      const order = await res.json();
      router.push(`/orders/${order.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to place order");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 p-6 max-w-5xl mx-auto">
      <div className="flex flex-col items-center">
        <TshirtCanvas
          ref={canvasRef}
          color={color}
          onObjectSelected={setObjectSelected}
        />
        <CanvasToolbar canvasRef={canvasRef} visible={objectSelected} />
      </div>

      <div className="flex flex-col gap-6 flex-1 min-w-0">
        <section>
          <h2 className="font-semibold text-sm text-gray-700 mb-2 uppercase tracking-wide">
            1. Upload Your Design (PNG)
          </h2>
          <ImageUploader onUploaded={handleUploaded} />
          {hasDesign && (
            <p className="text-green-600 text-sm mt-1">✓ Design loaded on canvas</p>
          )}
        </section>

        <section>
          <h2 className="font-semibold text-sm text-gray-700 mb-2 uppercase tracking-wide">
            2. Choose Shirt Color
          </h2>
          <ColorPicker selected={color} onChange={handleColorChange} />
        </section>

        <section>
          <h2 className="font-semibold text-sm text-gray-700 mb-2 uppercase tracking-wide">
            3. Notes (optional)
          </h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Any special instructions..."
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </section>

        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}

        <button
          onClick={handlePlaceOrder}
          disabled={placing || !hasDesign}
          className="bg-gray-900 text-white py-3 rounded font-medium hover:bg-gray-700 disabled:opacity-50"
        >
          {placing ? "Placing Order..." : "Place Order"}
        </button>
      </div>
    </div>
  );
}

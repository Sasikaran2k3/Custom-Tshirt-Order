"use client";

import { TshirtCanvasHandle } from "./TshirtCanvas";

interface CanvasToolbarProps {
  canvasRef: React.RefObject<TshirtCanvasHandle>;
  visible: boolean;
}

export default function CanvasToolbar({ canvasRef, visible }: CanvasToolbarProps) {
  if (!visible) return null;

  return (
    <div className="flex gap-2 mt-2 flex-wrap">
      <button
        onClick={() => canvasRef.current?.rotateDesign(-15)}
        className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
      >
        ↺ -15°
      </button>
      <button
        onClick={() => canvasRef.current?.rotateDesign(15)}
        className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
      >
        ↻ +15°
      </button>
      <button
        onClick={() => canvasRef.current?.scaleDesign(1.1)}
        className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
      >
        + Scale
      </button>
      <button
        onClick={() => canvasRef.current?.scaleDesign(0.9)}
        className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
      >
        − Scale
      </button>
      <button
        onClick={() => canvasRef.current?.centerDesign()}
        className="px-3 py-1 bg-blue-200 rounded text-sm hover:bg-blue-300"
      >
        Center
      </button>
      <button
        onClick={() => canvasRef.current?.deleteDesign()}
        className="px-3 py-1 bg-red-200 rounded text-sm hover:bg-red-300"
      >
        Delete
      </button>
    </div>
  );
}

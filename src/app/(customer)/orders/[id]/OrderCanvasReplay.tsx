"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { TshirtCanvasHandle } from "@/components/canvas/TshirtCanvas";
import type { ShirtColor } from "@/hooks/useCanvas";

const TshirtCanvas = dynamic(() => import("@/components/canvas/TshirtCanvas"), { ssr: false });

interface OrderCanvasReplayProps {
  color: ShirtColor;
  imageUrl: string;
  canvasState: object;
}

export default function OrderCanvasReplay({ color, imageUrl, canvasState }: OrderCanvasReplayProps) {
  const canvasRef = useRef<TshirtCanvasHandle>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const timer = setTimeout(() => {
      canvasRef.current?.loadFromJSON(canvasState);
    }, 500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  return (
    <TshirtCanvas
      ref={canvasRef}
      color={color}
      readOnly
    />
  );
}

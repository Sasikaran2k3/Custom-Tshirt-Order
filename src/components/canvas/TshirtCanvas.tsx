"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { fabric } from "fabric";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PRINT_AREA,
  ShirtColor,
  getMockupUrl,
  useCanvas,
} from "@/hooks/useCanvas";

export interface TshirtCanvasHandle {
  loadDesign: (imageUrl: string) => void;
  switchColor: (color: ShirtColor) => void;
  rotateDesign: (delta: number) => void;
  scaleDesign: (factor: number) => void;
  centerDesign: () => void;
  deleteDesign: () => void;
  getCanvasJSON: () => object;
  getPlacement: () => {
    placementX: number;
    placementY: number;
    placementScale: number;
    placementAngle: number;
  } | null;
  loadFromJSON: (json: object) => void;
}

interface TshirtCanvasProps {
  color: ShirtColor;
  readOnly?: boolean;
  onObjectSelected?: (selected: boolean) => void;
}

function loadMockup(canvas: any, color: ShirtColor) {
  fabric.Image.fromURL(
    getMockupUrl(color),
    (img: any) => {
      img.set({
        left: 0,
        top: 0,
        selectable: false,
        evented: false,
        lockMovementX: true,
        lockMovementY: true,
        isBackground: true,
      });
      img.scaleToWidth(CANVAS_WIDTH);
      canvas.add(img);
      canvas.sendToBack(img);
      canvas.renderAll();
    },
    { crossOrigin: "anonymous" }
  );
}

const TshirtCanvas = forwardRef<TshirtCanvasHandle, TshirtCanvasProps>(
  ({ color, readOnly = false, onObjectSelected }, ref) => {
    const canvasElRef = useRef<HTMLCanvasElement>(null);
    const { canvasRef, constrainToPrintArea, getDesignLayer, getPlacementValues } = useCanvas();
    const [fabricLoaded, setFabricLoaded] = useState(false);
    const colorRef = useRef(color);

    useEffect(() => {
      if (!canvasElRef.current) return;

      const canvas = new fabric.Canvas(canvasElRef.current, {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        selection: !readOnly,
      });
      canvasRef.current = canvas;
      loadMockup(canvas, colorRef.current);
      setFabricLoaded(true);

      if (!readOnly) {
        canvas.on("object:moving", (e: any) => {
          if (e.target?.get("isDesign")) {
            constrainToPrintArea(e.target);
          }
        });

        canvas.on("selection:created", () => onObjectSelected?.(true));
        canvas.on("selection:updated", () => onObjectSelected?.(true));
        canvas.on("selection:cleared", () => onObjectSelected?.(false));
      }

      return () => {
        canvas.dispose();
        canvasRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Switch shirt color without touching design layer
    useEffect(() => {
      if (!canvasRef.current || !fabricLoaded) return;
      const canvas = canvasRef.current;

      const bg = canvas.getObjects().find((o: any) => o.get("isBackground"));
      if (bg) canvas.remove(bg);

      loadMockup(canvas, color);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [color, fabricLoaded]);

    useImperativeHandle(ref, () => ({
      loadDesign(imageUrl: string) {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;

        const existing = getDesignLayer();
        if (existing) canvas.remove(existing);

        fabric.Image.fromURL(
          imageUrl,
          (img: any) => {
            const maxDim = Math.min(PRINT_AREA.width, PRINT_AREA.height) * 0.9;
            const scale = maxDim / Math.max(img.width ?? 1, img.height ?? 1);

            img.set({
              left: PRINT_AREA.left + (PRINT_AREA.width - (img.width ?? 0) * scale) / 2,
              top: PRINT_AREA.top + (PRINT_AREA.height - (img.height ?? 0) * scale) / 2,
              scaleX: scale,
              scaleY: scale,
              selectable: !readOnly,
              hasControls: !readOnly,
              lockUniScaling: true,
              isDesign: true,
            });

            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
          },
          { crossOrigin: "anonymous" }
        );
      },

      switchColor(newColor: ShirtColor) {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const bg = canvas.getObjects().find((o: any) => o.get("isBackground"));
        if (bg) canvas.remove(bg);
        loadMockup(canvas, newColor);
      },

      rotateDesign(delta: number) {
        const design = getDesignLayer();
        if (!design || !canvasRef.current) return;
        design.set("angle", (design.angle ?? 0) + delta);
        canvasRef.current.renderAll();
      },

      scaleDesign(factor: number) {
        const design = getDesignLayer();
        if (!design || !canvasRef.current) return;
        design.set("scaleX", (design.scaleX ?? 1) * factor);
        design.set("scaleY", (design.scaleY ?? 1) * factor);
        constrainToPrintArea(design);
        canvasRef.current.renderAll();
      },

      centerDesign() {
        const design = getDesignLayer();
        if (!design || !canvasRef.current) return;
        design.set({
          left:
            PRINT_AREA.left +
            (PRINT_AREA.width - (design.width ?? 0) * (design.scaleX ?? 1)) / 2,
          top:
            PRINT_AREA.top +
            (PRINT_AREA.height - (design.height ?? 0) * (design.scaleY ?? 1)) / 2,
        });
        canvasRef.current.renderAll();
      },

      deleteDesign() {
        const design = getDesignLayer();
        if (!design || !canvasRef.current) return;
        canvasRef.current.remove(design);
        canvasRef.current.renderAll();
        onObjectSelected?.(false);
      },

      getCanvasJSON() {
        const design = getDesignLayer();
        if (!design) return {};
        return design.toObject(["isDesign"]);
      },

      getPlacement() {
        return getPlacementValues();
      },

      loadFromJSON(json: object) {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;

        (fabric.Image as any).fromObject(json as any, (img: any) => {
          img.set({
            selectable: false,
            hasControls: false,
            evented: false,
            isDesign: true,
          });
          canvas.add(img);
          canvas.renderAll();
        });
      },
    }));

    return (
      <div className="border border-gray-300 inline-block">
        <canvas ref={canvasElRef} />
      </div>
    );
  }
);

TshirtCanvas.displayName = "TshirtCanvas";
export default TshirtCanvas;

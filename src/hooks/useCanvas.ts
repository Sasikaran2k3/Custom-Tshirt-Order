import { useRef, useCallback } from "react";

export const CANVAS_WIDTH = 500;
export const CANVAS_HEIGHT = 600;

export const PRINT_AREA = {
  left: 160,
  top: 130,
  width: 180,
  height: 180,
};

export type ShirtColor = "white" | "black" | "navy" | "red" | "grey";

export const SHIRT_COLORS: { value: ShirtColor; label: string; hex: string }[] = [
  { value: "white", label: "White", hex: "#FFFFFF" },
  { value: "black", label: "Black", hex: "#1A1A1A" },
  { value: "navy", label: "Navy", hex: "#1B2A4A" },
  { value: "red", label: "Red", hex: "#C0392B" },
  { value: "grey", label: "Grey", hex: "#7F8C8D" },
];

export function getMockupUrl(color: ShirtColor): string {
  return `/mockups/tshirt-${color}.svg`;
}

export function useCanvas() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const constrainToPrintArea = useCallback((obj: any) => {
    const objLeft = obj.left ?? 0;
    const objTop = obj.top ?? 0;
    const objWidth = (obj.width ?? 0) * (obj.scaleX ?? 1);
    const objHeight = (obj.height ?? 0) * (obj.scaleY ?? 1);

    const minLeft = PRINT_AREA.left;
    const maxLeft = PRINT_AREA.left + PRINT_AREA.width - objWidth;
    const minTop = PRINT_AREA.top;
    const maxTop = PRINT_AREA.top + PRINT_AREA.height - objHeight;

    obj.set({
      left: Math.min(Math.max(objLeft, minLeft), Math.max(minLeft, maxLeft)),
      top: Math.min(Math.max(objTop, minTop), Math.max(minTop, maxTop)),
    });
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getDesignLayer = useCallback((): any => {
    if (!canvasRef.current) return null;
    const objects = canvasRef.current.getObjects();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return objects.find((o: any) => o.get("isDesign")) ?? null;
  }, []);

  const getPlacementValues = useCallback(() => {
    const design = getDesignLayer();
    if (!design) return null;

    return {
      placementX: (design.left ?? 0) / CANVAS_WIDTH,
      placementY: (design.top ?? 0) / CANVAS_HEIGHT,
      placementScale: design.scaleX ?? 1,
      placementAngle: design.angle ?? 0,
    };
  }, [getDesignLayer]);

  return {
    canvasRef,
    constrainToPrintArea,
    getDesignLayer,
    getPlacementValues,
  };
}

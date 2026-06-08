"use client";

import { SHIRT_COLORS, ShirtColor } from "@/hooks/useCanvas";

interface ColorPickerProps {
  selected: ShirtColor;
  onChange: (color: ShirtColor) => void;
}

export default function ColorPicker({ selected, onChange }: ColorPickerProps) {
  return (
    <div className="flex gap-3 flex-wrap">
      {SHIRT_COLORS.map((c) => (
        <button
          key={c.value}
          onClick={() => onChange(c.value)}
          title={c.label}
          className="flex flex-col items-center gap-1"
        >
          <span
            className="w-8 h-8 rounded-full border-2 inline-block"
            style={{
              backgroundColor: c.hex,
              borderColor: selected === c.value ? "#2563EB" : "#9CA3AF",
              outline: selected === c.value ? "2px solid #2563EB" : "none",
              outlineOffset: "2px",
            }}
          />
          <span className="text-xs">{c.label}</span>
        </button>
      ))}
    </div>
  );
}

"use client";

import { useState } from "react";

export function ClickTargetInput({ arrowNumber }: { arrowNumber: number }) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null
  );

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const percentX = (clickX / rect.width) * 100;
    const percentY = (clickY / rect.height) * 100;

    const x = Number((percentX - 50).toFixed(2));
    const y = Number((50 - percentY).toFixed(2));

    setPosition({ x, y });
  }

  function clearPosition() {
    setPosition(null);
  }

  return (
    <div className="mt-3">
      <input type="hidden" name={`position_x_${arrowNumber}`} value={position?.x ?? ""} />
      <input type="hidden" name={`position_y_${arrowNumber}`} value={position?.y ?? ""} />

      <p className="text-sm text-center text-slate-600 mb-2">
        Haz clic en la diana
      </p>

      <div
        onClick={handleClick}
        className="relative mx-auto aspect-square w-full max-w-[190px] cursor-crosshair rounded-full bg-white shadow-lg overflow-hidden"
      >
        <div className="absolute inset-0 rounded-full bg-white" />
        <div className="absolute inset-[7%] rounded-full bg-neutral-900" />
        <div className="absolute inset-[17%] rounded-full bg-sky-500" />
        <div className="absolute inset-[27%] rounded-full bg-orange-600" />
        <div className="absolute inset-[37%] rounded-full bg-yellow-300" />

        {position && (
          <div
            className="absolute z-20 w-4 h-4 -ml-2 -mt-2 rounded-full bg-cyan-400 border-2 border-white shadow"
            style={{
              left: `${50 + position.x}%`,
              top: `${50 - position.y}%`,
            }}
          />
        )}
      </div>

      <div className="flex justify-center mt-3">
        <button
          type="button"
          onClick={clearPosition}
          className="border rounded-lg px-3 py-1 text-sm text-red-600 hover:bg-red-50"
        >
          Limpiar
        </button>
      </div>
    </div>
  );
}
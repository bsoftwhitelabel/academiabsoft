"use client";

import { useEffect, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { RotateCcw, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onSign: (dataUrl: string) => void;
  onCancel?: () => void;
  /** Pre-existing signature (data URL) to display instead of canvas */
  existingDataUrl?: string;
  className?: string;
};

export function SignaturePad({ onSign, onCancel, existingDataUrl, className }: Props) {
  const ref = useRef<SignatureCanvas | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 220 });

  // resize the canvas to fill the wrapper width
  useEffect(() => {
    if (existingDataUrl) return;
    const update = () => {
      if (!wrapRef.current) return;
      const w = wrapRef.current.clientWidth - 16;
      setCanvasSize({ width: Math.max(300, w), height: 220 });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [existingDataUrl]);

  const clear = () => {
    ref.current?.clear();
    setIsEmpty(true);
  };

  const confirm = () => {
    if (!ref.current || ref.current.isEmpty()) return;
    const dataUrl = ref.current.toDataURL("image/png");
    onSign(dataUrl);
  };

  if (existingDataUrl) {
    return (
      <div className={className}>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
            <Check className="h-3.5 w-3.5" strokeWidth={2.75} />
            Assinatura registada
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={existingDataUrl}
            alt="Assinatura digital"
            className="max-h-40 w-full rounded-lg border border-border bg-white object-contain p-3"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        ref={wrapRef}
        className="rounded-2xl border-2 border-dashed border-navy/15 bg-surface-low/60 p-2 transition-colors hover:border-navy/30"
      >
        <SignatureCanvas
          ref={ref}
          onEnd={() => setIsEmpty(false)}
          canvasProps={{
            width: canvasSize.width,
            height: canvasSize.height,
            className: "rounded-lg bg-white",
            "aria-label": "Área de assinatura",
          }}
          penColor="#0B2447"
          minWidth={1.4}
          maxWidth={2.6}
          velocityFilterWeight={0.7}
        />
        <p className="mt-2 px-2 pb-1 text-[11px] text-ink-subtle">
          Use o dedo (tablet) ou o rato (desktop) para assinar dentro da
          moldura.
        </p>
      </div>
      <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              className="text-ink-muted"
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={clear}
            disabled={isEmpty}
          >
            <RotateCcw className="h-4 w-4" />
            Limpar
          </Button>
        </div>
        <Button
          type="button"
          onClick={confirm}
          disabled={isEmpty}
          className="bg-navy text-white hover:bg-navy/90"
        >
          <Check className="h-4 w-4" />
          Confirmar Assinatura
        </Button>
      </div>
    </div>
  );
}

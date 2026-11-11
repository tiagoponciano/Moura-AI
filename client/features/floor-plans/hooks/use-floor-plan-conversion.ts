"use client";

import { saveAs } from "file-saver";
import { useState } from "react";
import { errorMessage } from "@/lib/api/request-json";
import {
  convertPlan,
  detectScale,
  parseScale,
  type ConversionFormat,
} from "../lib/floor-plan-conversion";
import type { SelectedFloorPlan } from "./use-floor-plan";

export type ConversionOutcome = {
  mode: "vector" | "raster";
  warnings: string[];
  scale?: number;
  format: ConversionFormat;
};

/** Reading the scale and converting the chosen plan; the result of the last conversion stays on screen. */
export function useFloorPlanConversion(plan: SelectedFloorPlan | undefined) {
  const [scaleText, setScaleText] = useState("");
  const [busy, setBusy] = useState<"scale" | ConversionFormat>();
  const [outcome, setOutcome] = useState<ConversionOutcome>();
  const [notice, setNotice] = useState<string>();
  const [error, setError] = useState<string>();

  const scale = parseScale(scaleText);
  const scaleInvalid = scaleText.trim() !== "" && scale === undefined;

  async function readScale() {
    if (!plan) return;
    setBusy("scale");
    setError(undefined);
    setNotice(undefined);
    try {
      const found = await detectScale(plan.file);
      if (found) setScaleText(`1:${found}`);
      else setNotice("A escala não está escrita na planta. Informe-a abaixo.");
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(undefined);
    }
  }

  async function convert(format: ConversionFormat) {
    if (!plan || scaleInvalid) return;
    setBusy(format);
    setError(undefined);
    setNotice(undefined);
    try {
      const result = await convertPlan(plan.file, format, scale);
      saveAs(result.blob, result.fileName);
      setOutcome({
        mode: result.mode,
        warnings: result.warnings,
        scale,
        format,
      });
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(undefined);
    }
  }

  /** Forgets the outcome and the scale, for when another plan is chosen or the plan is removed. */
  function reset() {
    setScaleText("");
    setOutcome(undefined);
    setNotice(undefined);
    setError(undefined);
  }

  return {
    scaleText,
    setScaleText,
    scaleInvalid,
    busy,
    outcome,
    notice,
    error,
    readScale,
    convert,
    reset,
  };
}

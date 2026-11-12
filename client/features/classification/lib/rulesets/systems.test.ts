import { describe, expect, it } from "vitest";
import { systemIdFromLabel, systemLabel } from "./systems";

describe("systemIdFromLabel", () => {
  it("maps the labels one system has in different tables to one id", () => {
    expect(systemIdFromLabel("Instalação elétrica de baixa tensão")).toBe(
      "low_voltage_installations",
    );
    expect(systemIdFromLabel("Instalações elétricas de baixa voltagem")).toBe(
      "low_voltage_installations",
    );
  });

  it("ignores case and extra spaces", () => {
    expect(systemIdFromLabel("  Brigada  de Incêndio ")).toBe("fire_brigade");
    expect(systemIdFromLabel("Saídas de Emergência")).toBe("emergency_exits");
  });

  it("keeps alarm and automatic detection apart", () => {
    expect(systemIdFromLabel("Alarme de incêndio")).toBe("fire_alarm");
    expect(systemIdFromLabel("Detecção automática de incêndio")).toBe(
      "automatic_detection",
    );
  });

  it("refuses a label nobody reviewed instead of dropping the system", () => {
    expect(() => systemIdFromLabel("Espuma")).toThrow(
      'Unknown system label: "Espuma"',
    );
  });
});

describe("systemLabel", () => {
  it("names a known system and echoes an unknown id", () => {
    expect(systemLabel("sprinklers")).toBe("Chuveiros automáticos");
    expect(systemLabel("mystery")).toBe("mystery");
  });
});

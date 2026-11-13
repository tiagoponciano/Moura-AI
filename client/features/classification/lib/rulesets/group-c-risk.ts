import type { Condition, Rule } from "../engine/types";
import {
  C2,
  C3,
  COVERED_DIVISIONS,
  fact,
  heightAbove,
  heightAtMost,
} from "./group-c-conditions";

/** IN 1 parte 1, art. 165: "entra em vigor em 24 de abril de 2024". */
const VALID_FROM = "2024-04-24";
const DOC = "IN-1-P1";

const level = (value: string) => ({ set: { fact: "risk_level", value } });

export const riskRule = (
  id: string,
  name: string,
  priority: number,
  when: Condition,
  value: string,
  locator: string,
  quote: string,
): Rule => ({
  id,
  name,
  version: "1",
  validFrom: VALID_FROM,
  stage: "risk",
  priority,
  when,
  then: level(value),
  source: { doc: DOC, locator, quote },
  status: "provisional",
});

/** What each level means for the process, as the norm says it (art. 5º, § 2º). */
export const RISK_PROCESS: Record<string, string> = {
  I: "Dispensada de atos de liberação da atividade econômica pelo CBMSC, mas deve cumprir as exigências normativas de segurança contra incêndio e pânico.",
  II: "O CBMSC concede permissão para início das atividades sem prévia regularização e fiscalização do imóvel, mediante solicitação de vistoria para funcionamento e autodeclaração (Anexo G); processo simplificado de tramitação e regularização.",
  III: "Processo simplificado de tramitação e regularização; o imóvel sem atestados para construção e habite-se precisa de prévia regularização para iniciar as atividades econômicas.",
  IV: "A tramitação dos processos e a forma de regularização seguem o rito ordinário.",
  V: "Tramita no processo ordinário.",
};

const NO_SPECIAL = fact("special_risks", "eq", false);

/**
 * The risk level, checked in the order of the specification: V first, then I,
 * II, III and finally IV. The first rule that holds decides; one that cannot be
 * evaluated stops the cascade and the missing answers are asked.
 */
export const GROUP_C_RISK_RULES: Rule[] = [
  riskRule(
    "IN1P1-RISK-V",
    "Risco V",
    10,
    {
      any: [
        fact("fire_load_class", "eq", "very_high"),
        {
          all: [
            fact("special_risks", "eq", true),
            {
              any: [
                fact("hazardous_substances", "eq", true),
                fact("flammable_internal_l", "gt", 1000),
                fact("flammable_external_m3", "gt", 40),
              ],
            },
          ],
        },
      ],
    },
    "V",
    "Art. 5º, § 2º, V; Nota 3",
    "risco V: [...] depósito, manuseio, armazenamento, fabricação e/ou comércio de substâncias radioativas, inflamáveis classe I acima de 1.000 L em área interna, tóxicas ou explosivas, artefatos pirotécnicos e munições [...]; ou aquela desenvolvida em ocupação com carga de incêndio acima de 2.280 MJ/m². Volume em área externa: V > 40 m³ → Risco V",
  ),
  riskRule(
    "IN1P1-RISK-I",
    "Risco I",
    20,
    fact("risk_exempt", "eq", true),
    "I",
    "Art. 5º, § 2º, I, alíneas a a h",
    "risco I: compreende as atividades econômicas consideradas de baixo risco [...] aquelas exercidas exclusivamente em empresas sem estabelecimento; [...] ambulantes; [...] edificação residencial privativa unifamiliar de até 200 m² de área total construída e com no máximo 1 (um) empregado; [...] escritórios virtuais ou espaços de coworking",
  ),
  riskRule(
    "IN1P1-RISK-II",
    "Risco II",
    30,
    {
      all: [
        COVERED_DIVISIONS,
        fact("area_m2", "lte", 750),
        fact("storeys", "lte", 3),
        {
          any: [
            NO_SPECIAL,
            {
              all: [
                fact("glp_kg", "lte", 190),
                fact("flammable_internal_l", "lte", 250),
                fact("flammable_external_m3", "lte", 20),
              ],
            },
          ],
        },
      ],
    },
    "II",
    "Anexo A, Quadro 1",
    "QUADRO 1 - Características dos imóveis Risco II: Área ≤ 750 m²; Altura ≤ 3 pavimentos; Uso/Armazenamento de GLP ≤ 190 kg; Líquido inflamável em área interna ≤ 250 L; Líquido inflamável/combustível em área externa ≤ 20 m³",
  ),
  riskRule(
    "IN1P1-RISK-III-C1",
    "Risco III, C-1",
    41,
    {
      all: [
        fact("division", "eq", "C-1"),
        heightAtMost(21),
        fact("area_m2", "lte", 5000),
      ],
    },
    "III",
    "Anexo A, Quadro 2, C-1",
    "QUADRO 2 - Risco III (relação área e altura): C-1, altura ≤ 21 m, área ≤ 5.000 m²",
  ),
  riskRule(
    "IN1P1-RISK-III-C2-medium",
    "Risco III, C-2 de carga média",
    42,
    {
      all: [
        C2,
        fact("fire_load_class", "eq", "medium"),
        heightAtMost(12),
        fact("area_m2", "lte", 5000),
      ],
    },
    "III",
    "Anexo A, Quadro 2, C-2 (CI média)",
    "QUADRO 2 - Risco III (relação área e altura): C-2 (CI média), altura ≤ 12 m, área ≤ 5.000 m²",
  ),
  riskRule(
    "IN1P1-RISK-III-C2-high",
    "Risco III, C-2 de carga alta",
    43,
    {
      all: [
        C2,
        fact("fire_load_class", "eq", "high"),
        heightAtMost(12),
        fact("area_m2", "lte", 3000),
      ],
    },
    "III",
    "Anexo A, Quadro 2, C-2 (CI alta)",
    "QUADRO 2 - Risco III (relação área e altura): C-2 (CI alta), altura ≤ 12 m, área ≤ 3.000 m²",
  ),
  riskRule(
    "IN1P1-RISK-III-C3-low",
    "Risco III, C-3 até 6 m",
    44,
    {
      all: [C3, heightAtMost(6), fact("area_m2", "lte", 5000)],
    },
    "III",
    "Anexo A, Quadro 2, C-3",
    "QUADRO 2 - Risco III (relação área e altura): C-3, altura ≤ 6 m, área ≤ 5.000 m²",
  ),
  riskRule(
    "IN1P1-RISK-III-C3-mid",
    "Risco III, C-3 de 6 a 12 m",
    45,
    {
      all: [C3, heightAbove(6), heightAtMost(12), fact("area_m2", "lte", 3000)],
    },
    "III",
    "Anexo A, Quadro 2, C-3",
    "QUADRO 2 - Risco III (relação área e altura): C-3, 6 < h ≤ 12 m, área ≤ 3.000 m²",
  ),
  riskRule(
    "IN1P1-RISK-IV",
    "Risco IV",
    90,
    COVERED_DIVISIONS,
    "IV",
    "Art. 5º, § 2º, IV",
    "risco IV: qualquer atividade desenvolvida em imóveis com características que não se enquadram nos riscos I, II e III e V",
  ),
];

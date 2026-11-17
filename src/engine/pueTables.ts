export enum ConductorMaterial {
  COPPER = 'COPPER',
  ALUMINUM = 'ALUMINUM',
}

export enum InsulationType {
  PVC_70 = 'PVC_70',     // ПВХ (ВВГ, АВВГ, NYM) — макс. +70°C
  XLPE_90 = 'XLPE_90',   // СПЭ / Резина (ПвВГ, АПвВГ, КГ) — макс. +90°C
}

export enum InstallationMethod {
  OPEN_AIR = 'OPEN_AIR', // Открыто (по воздуху, на лотках)
  CONDUIT = 'CONDUIT',   // Скрыто (в штробе, трубе, гофре, кабель-канале)
  GROUND = 'GROUND',     // В земле (траншее)
}

export enum LoadedCores {
  ONE = 1,               // Одножильный (1 нагруженная жила)
  TWO = 2,               // Двухжильный (2 нагруженные жилы, 1 фаза)
  THREE = 3,             // Трехжильный (3 нагруженные жилы, 3 фазы)
}

export enum PhaseCount {
  SINGLE_PHASE = 1,      // 1 фаза (220 / 230 В)
  THREE_PHASE = 3,       // 3 фазы (380 / 400 В)
}

export enum BreakerCurve {
  B = 'B',               // 3–5 In (расчетный с запасом 1.1 -> 5.5 In)
  C = 'C',               // 5–10 In (расчетный с запасом 1.1 -> 11 In)
  D = 'D',               // 10–20 In (расчетный с запасом 1.1 -> 22 In)
}

export enum BundleCount {
  SINGLE = 'SINGLE',     // 1 кабель (K = 1.00)
  TWO = 'TWO',           // 2 кабеля (K = 0.85)
  THREE = 'THREE',       // 3 кабеля (K = 0.79)
  FOUR = 'FOUR',         // 4 кабеля (K = 0.75)
  FIVE_SIX = 'FIVE_SIX', // 5–6 кабелей (K = 0.70)
  SEVEN_NINE = 'SEVEN_NINE', // 7–9 кабелей (K = 0.65)
}

export interface AmpacityRow {
  open1: number;
  open2: number;
  open3: number;
  conduit1: number;
  conduit2: number;
  conduit3: number;
  ground1: number;
  ground2: number;
  ground3: number;
}

export const STANDARD_SECTIONS: number[] = [
  0.5, 0.75, 1.0, 1.5, 2.5, 4.0, 6.0, 10.0, 16.0,
  25.0, 35.0, 50.0, 70.0, 95.0, 120.0, 150.0, 185.0, 240.0,
];

export const STANDARD_BREAKERS: number[] = [
  1, 2, 3, 4, 6, 10, 13, 16, 20, 25, 32, 40,
  50, 63, 80, 100, 125, 160, 200, 250, 320, 400, 500, 630,
];

// ПУЭ 7-е изд., Табл. 1.3.4 и 1.3.6 — Медь (Cu), ПВХ (+70°C)
export const COPPER_PVC_TABLE: Record<number, AmpacityRow> = {
  0.5:   { open1: 11,   open2: 9.5,  open3: 8.5,  conduit1: 9.5,  conduit2: 8.0,  conduit3: 7.5,  ground1: 14,  ground2: 12,  ground3: 11 },
  0.75:  { open1: 15,   open2: 13,   open3: 11.5, conduit1: 13,   conduit2: 11,   conduit3: 10,   ground1: 19,  ground2: 16,  ground3: 14 },
  1.0:   { open1: 17,   open2: 16,   open3: 14,   conduit1: 16,   conduit2: 15,   conduit3: 14,   ground1: 23,  ground2: 20,  ground3: 18 },
  1.5:   { open1: 23,   open2: 19,   open3: 17,   conduit1: 19,   conduit2: 18,   conduit3: 15,   ground1: 31,  ground2: 27,  ground3: 23 },
  2.5:   { open1: 30,   open2: 27,   open3: 25,   conduit1: 27,   conduit2: 21,   conduit3: 19,   ground1: 42,  ground2: 38,  ground3: 33 },
  4.0:   { open1: 41,   open2: 38,   open3: 35,   conduit1: 38,   conduit2: 32,   conduit3: 27,   ground1: 55,  ground2: 49,  ground3: 43 },
  6.0:   { open1: 50,   open2: 46,   open3: 42,   conduit1: 46,   conduit2: 38,   conduit3: 34,   ground1: 69,  ground2: 60,  ground3: 53 },
  10.0:  { open1: 80,   open2: 70,   open3: 60,   conduit1: 70,   conduit2: 55,   conduit3: 50,   ground1: 95,  ground2: 85,  ground3: 75 },
  16.0:  { open1: 100,  open2: 85,   open3: 80,   conduit1: 85,   conduit2: 75,   conduit3: 70,   ground1: 125, ground2: 110, ground3: 100 },
  25.0:  { open1: 140,  open2: 115,  open3: 100,  conduit1: 115,  conduit2: 95,   conduit3: 85,   ground1: 165, ground2: 145, ground3: 130 },
  35.0:  { open1: 170,  open2: 135,  open3: 125,  conduit1: 135,  conduit2: 120,  conduit3: 100,  ground1: 200, ground2: 175, ground3: 160 },
  50.0:  { open1: 215,  open2: 175,  open3: 160,  conduit1: 185,  conduit2: 145,  conduit3: 135,  ground1: 245, ground2: 215, ground3: 195 },
  70.0:  { open1: 270,  open2: 215,  open3: 195,  conduit1: 225,  conduit2: 180,  conduit3: 165,  ground1: 300, ground2: 265, ground3: 240 },
  95.0:  { open1: 325,  open2: 260,  open3: 230,  conduit1: 275,  conduit2: 220,  conduit3: 200,  ground1: 360, ground2: 315, ground3: 285 },
  120.0: { open1: 385,  open2: 300,  open3: 260,  conduit1: 315,  conduit2: 260,  conduit3: 235,  ground1: 410, ground2: 360, ground3: 325 },
  150.0: { open1: 440,  open2: 340,  open3: 295,  conduit1: 360,  conduit2: 305,  conduit3: 275,  ground1: 465, ground2: 405, ground3: 365 },
  185.0: { open1: 510,  open2: 395,  open3: 340,  conduit1: 415,  conduit2: 350,  conduit3: 315,  ground1: 520, ground2: 455, ground3: 410 },
  240.0: { open1: 605,  open2: 465,  open3: 405,  conduit1: 490,  conduit2: 415,  conduit3: 375,  ground1: 600, ground2: 525, ground3: 470 },
};

// ПУЭ 7-е изд., Табл. 1.3.5 и 1.3.7 — Алюминий (Al), ПВХ (+70°C)
export const ALUMINUM_PVC_TABLE: Record<number, AmpacityRow> = {
  2.5:   { open1: 24,   open2: 20,   open3: 19,   conduit1: 20,   conduit2: 16,   conduit3: 15,   ground1: 32,  ground2: 29,  ground3: 25 },
  4.0:   { open1: 32,   open2: 28,   open3: 27,   conduit1: 28,   conduit2: 24,   conduit3: 21,   ground1: 42,  ground2: 38,  ground3: 33 },
  6.0:   { open1: 39,   open2: 36,   open3: 32,   conduit1: 36,   conduit2: 29,   conduit3: 26,   ground1: 53,  ground2: 46,  ground3: 41 },
  10.0:  { open1: 60,   open2: 50,   open3: 47,   conduit1: 50,   conduit2: 42,   conduit3: 38,   ground1: 73,  ground2: 65,  ground3: 58 },
  16.0:  { open1: 75,   open2: 60,   open3: 60,   conduit1: 60,   conduit2: 55,   conduit3: 55,   ground1: 96,  ground2: 85,  ground3: 77 },
  25.0:  { open1: 105,  open2: 85,   open3: 75,   conduit1: 85,   conduit2: 70,   conduit3: 65,   ground1: 127, ground2: 112, ground3: 100 },
  35.0:  { open1: 130,  open2: 100,  open3: 95,   conduit1: 100,  conduit2: 90,   conduit3: 75,   ground1: 154, ground2: 135, ground3: 123 },
  50.0:  { open1: 165,  open2: 135,  open3: 125,  conduit1: 140,  conduit2: 110,  conduit3: 105,  ground1: 189, ground2: 165, ground3: 150 },
  70.0:  { open1: 210,  open2: 165,  open3: 150,  conduit1: 175,  conduit2: 140,  conduit3: 130,  ground1: 231, ground2: 204, ground3: 185 },
  95.0:  { open1: 255,  open2: 200,  open3: 175,  conduit1: 215,  conduit2: 170,  conduit3: 155,  ground1: 277, ground2: 243, ground3: 220 },
  120.0: { open1: 295,  open2: 230,  open3: 200,  conduit1: 245,  conduit2: 200,  conduit3: 180,  ground1: 316, ground2: 277, ground3: 250 },
  150.0: { open1: 340,  open2: 260,  open3: 225,  conduit1: 275,  conduit2: 235,  conduit3: 210,  ground1: 358, ground2: 312, ground3: 280 },
  185.0: { open1: 390,  open2: 305,  open3: 260,  conduit1: 320,  conduit2: 270,  conduit3: 245,  ground1: 400, ground2: 350, ground3: 315 },
  240.0: { open1: 465,  open2: 355,  open3: 310,  conduit1: 375,  conduit2: 320,  conduit3: 290,  ground1: 462, ground2: 404, ground3: 362 },
};

// Коэффициент повышения токовой нагрузки для изоляции из сшитого полиэтилена (СПЭ +90°C)
// По ГОСТ 31996 / ПУЭ для рабочей температуры жилы +90°C относительно +70°C (~1.16–1.18 в воздухе и ~1.12 в земле)
export function getAmpacity(
  material: ConductorMaterial,
  insulation: InsulationType,
  section: number,
  method: InstallationMethod,
  cores: LoadedCores
): number {
  const table = material === ConductorMaterial.COPPER ? COPPER_PVC_TABLE : ALUMINUM_PVC_TABLE;
  const row = table[section];
  if (!row) return 0;

  let base = 0;
  if (method === InstallationMethod.OPEN_AIR) {
    base = cores === LoadedCores.ONE ? row.open1 : cores === LoadedCores.TWO ? row.open2 : row.open3;
  } else if (method === InstallationMethod.CONDUIT) {
    base = cores === LoadedCores.ONE ? row.conduit1 : cores === LoadedCores.TWO ? row.conduit2 : row.conduit3;
  } else {
    base = cores === LoadedCores.ONE ? row.ground1 : cores === LoadedCores.TWO ? row.ground2 : row.ground3;
  }

  if (insulation === InsulationType.XLPE_90) {
    const xlpeFactor = method === InstallationMethod.GROUND ? 1.13 : 1.18;
    return Math.round(base * xlpeFactor * 10) / 10;
  }

  return base;
}

// Таблица 1.3.3 ПУЭ — Поправочные коэффициенты на температуру среды
// Для нормируемой темп. в воздухе +25°C и в земле +15°C:
// K_t = sqrt((T_max - T_env) / (T_max - T_norm))
export function getTemperatureFactor(
  insulation: InsulationType,
  method: InstallationMethod,
  ambientTempC: number
): number {
  const tMax = insulation === InsulationType.PVC_70 ? 70 : 90;
  const tNorm = method === InstallationMethod.GROUND ? 15 : 25;

  if (ambientTempC >= tMax - 2) {
    return 0.25;
  }
  const ratio = (tMax - ambientTempC) / (tMax - tNorm);
  if (ratio <= 0) return 0.25;
  const k = Math.sqrt(ratio);
  return Math.round(k * 100) / 100;
}

// Таблица 1.3.26 ПУЭ — Снижающие коэффициенты для кабелей в пучке / лотке
export const BUNDLE_FACTORS: Record<BundleCount, { label: string; countDesc: string; factor: number }> = {
  [BundleCount.SINGLE]:     { label: '1',   countDesc: 'Одиночная прокладка (1 кабель)', factor: 1.00 },
  [BundleCount.TWO]:        { label: '2',   countDesc: '2 кабеля совместно',             factor: 0.85 },
  [BundleCount.THREE]:      { label: '3',   countDesc: '3 кабеля в пучке/трубе',         factor: 0.79 },
  [BundleCount.FOUR]:       { label: '4',   countDesc: '4 кабеля в пучке/трубе',         factor: 0.75 },
  [BundleCount.FIVE_SIX]:   { label: '5–6', countDesc: '5–6 кабелей в пучке/лотке',      factor: 0.70 },
  [BundleCount.SEVEN_NINE]: { label: '7–9', countDesc: '7–9 кабелей в пучке/лотке',      factor: 0.65 },
};

// Удельное сопротивление при рабочей температуре жилы (Ом·мм²/м)
export function getWorkingResistivity(material: ConductorMaterial, insulation: InsulationType): number {
  if (material === ConductorMaterial.COPPER) {
    return insulation === InsulationType.PVC_70 ? 0.0225 : 0.0240;
  } else {
    return insulation === InsulationType.PVC_70 ? 0.0360 : 0.0385;
  }
}

// Удельное сопротивление при +20°C для оценки петли «фаза-ноль»
export function getColdResistivity(material: ConductorMaterial): number {
  return material === ConductorMaterial.COPPER ? 0.0178 : 0.0285;
}

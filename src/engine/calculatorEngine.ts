import {
  BreakerCurve,
  BUNDLE_FACTORS,
  BundleCount,
  ConductorMaterial,
  getAmpacity,
  getTemperatureFactor,
  getWorkingResistivity,
  InstallationMethod,
  InsulationType,
  LoadedCores,
  PhaseCount,
  STANDARD_BREAKERS,
  STANDARD_SECTIONS,
} from './pueTables';

export interface CalculatorInput {
  material: ConductorMaterial;
  insulation: InsulationType;
  sectionMm2: number;
  phases: PhaseCount;
  voltage: number;         // 220/230 или 380/400 В
  cosPhi: number;          // 0.50 .. 1.00
  installationMethod: InstallationMethod;
  loadedCores: LoadedCores;
  lengthMeters: number;
  maxVoltageDropPercent: number; // 3% или 5%
  ambientTempC: number;
  bundleCount: BundleCount;
  breakerCurve: BreakerCurve;
  strictOverloadMargin: boolean; // Условие 1.45*In <= Iдд (повышенный запас для ПВХ в штробе)
}

export interface EngineeringWarning {
  id: string;
  severity: 'error' | 'warning' | 'info';
  title: string;
  clause: string;
  description: string;
}

export interface CalculationResult {
  // Токовые характеристики кабеля
  baseAmpacity: number;       // Табличный Iдд0 (А)
  tempFactor: number;         // Коэффициент температуры Kt (Табл. 1.3.3)
  bundleFactor: number;       // Коэффициент пучка Kb (Табл. 1.3.26)
  effectiveAmpacity: number;  // Расчетный Iдд = Iдд0 * Kt * Kb (А)

  // Подбор автоматического выключателя
  recommendedBreakerIn: number;      // Выбранный номинал АВ In <= Iдд (А)
  strictOverloadBreakerIn: number;   // Номинал АВ с запасом по тепловому расцепителю 1.45*In <= Iдд (А)
  activeBreakerIn: number;           // Активный номинал АВ для расчета мощности, потерь и КЗ
  thermalNonTripCurrentI1: number;   // 1.13 * In (ток условного нерасцепления, А)
  thermalTripCurrentI2: number;      // 1.45 * In (ток условного расцепления до 1 ч, А)
  cableOverloadLimit145: number;     // 1.45 * Iдд (предел перегрузки кабеля по ГОСТ Р 50571.4.43, А)
  cableLoadRatioPercent: number;     // (In / Iдд) * 100%
  isOverloadProtected: boolean;      // Выполнено ли условие In <= Iдд и I2 <= 1.45 * Iдд

  // Мощность (кВт)
  maxPowerByBreakerKw: number;       // Pмакс по автомату (кВт)
  maxPowerByCableKw: number;         // Pпред по кабелю (кВт)

  // Потери напряжения ΔU
  voltageDropVolts: number;          // ΔU в Вольтах при токе In
  voltageDropPercent: number;        // ΔU в %
  isVoltageDropOk: boolean;          // ΔU% <= ΔUдоп%
  recommendedSectionForDropMm2: number | null; // Рекомендуемое сечение при превышении ΔU

  // Проверка по току короткого замыкания (петля «фаза-ноль»)
  minShortCircuitCurrentA: number;   // Iкз min с учетом коэф. надежности 1.1 (А)
  curveMultiplier: number;           // 5.5 (B), 11 (C), 22 (D)
  maxLoopImpedanceOhm: number;       // Zпетли max = Uфаз / Iкз min (Ом)
  estimatedMaxLineLengthByScMeters: number; // Ориентировочная макс. длина линии по ТКЗ (м)

  // Готовая инженерная строка спецификации
  specificationString: string;

  // Динамические инженерные предупреждения
  warnings: EngineeringWarning[];
}

export function calculateCableAndBreaker(input: CalculatorInput): CalculationResult {
  // 1. Табличный и скорректированный длительно допустимый ток Iдд
  const baseAmpacity = getAmpacity(
    input.material,
    input.insulation,
    input.sectionMm2,
    input.installationMethod,
    input.loadedCores
  );

  const tempFactor = getTemperatureFactor(
    input.insulation,
    input.installationMethod,
    input.ambientTempC
  );

  const bundleFactor = BUNDLE_FACTORS[input.bundleCount].factor;
  const effectiveAmpacity = Math.round(baseAmpacity * tempFactor * bundleFactor * 10) / 10;

  // 2. Подбор стандартного номинала автомата In <= Iдд
  const matchingStandard = STANDARD_BREAKERS.filter((b) => b <= effectiveAmpacity);
  const recommendedBreakerIn =
    matchingStandard.length > 0 ? matchingStandard[matchingStandard.length - 1] : 0;

  // Строгий подбор с учетом запаса теплового расцепителя 1.45 * In <= Iдд (для скрытой проводки/ГОСТ)
  const matchingStrict = STANDARD_BREAKERS.filter((b) => b * 1.45 <= effectiveAmpacity);
  const strictOverloadBreakerIn =
    matchingStrict.length > 0
      ? matchingStrict[matchingStrict.length - 1]
      : recommendedBreakerIn;

  const activeBreakerIn = input.strictOverloadMargin
    ? strictOverloadBreakerIn
    : recommendedBreakerIn;

  const thermalNonTripCurrentI1 = Math.round(activeBreakerIn * 1.13 * 10) / 10;
  const thermalTripCurrentI2 = Math.round(activeBreakerIn * 1.45 * 10) / 10;
  const cableOverloadLimit145 = Math.round(effectiveAmpacity * 1.45 * 10) / 10;

  const cableLoadRatioPercent =
    effectiveAmpacity > 0
      ? Math.min(100, Math.round((activeBreakerIn / effectiveAmpacity) * 1000) / 10)
      : 0;

  const isOverloadProtected =
    activeBreakerIn > 0 &&
    activeBreakerIn <= effectiveAmpacity &&
    thermalTripCurrentI2 <= cableOverloadLimit145 + 0.05;

  // 3. Расчет мощности P (кВт)
  // 1 фаза: P = (U * I * cosPhi) / 1000
  // 3 фазы: P = (sqrt(3) * U * I * cosPhi) / 1000
  const phaseFactor = input.phases === PhaseCount.THREE_PHASE ? Math.sqrt(3) : 1.0;
  const maxPowerByBreakerKw =
    Math.round(((phaseFactor * input.voltage * activeBreakerIn * input.cosPhi) / 1000) * 100) /
    100;
  const maxPowerByCableKw =
    Math.round(((phaseFactor * input.voltage * effectiveAmpacity * input.cosPhi) / 1000) * 100) /
    100;

  // 4. Расчет потерь напряжения ΔU
  // 1 фаза: ΔU = (2 * In * L * rho) / S
  // 3 фазы: ΔU = (sqrt(3) * In * L * rho) / S
  const rho = getWorkingResistivity(input.material, input.insulation);
  const lengthMultiplier = input.phases === PhaseCount.SINGLE_PHASE ? 2.0 : Math.sqrt(3);

  const rawDropVolts =
    input.sectionMm2 > 0 && activeBreakerIn > 0 && input.lengthMeters > 0
      ? (lengthMultiplier * activeBreakerIn * input.lengthMeters * rho) / input.sectionMm2
      : 0;

  const voltageDropVolts = Math.round(rawDropVolts * 100) / 100;
  const voltageDropPercent =
    input.voltage > 0 ? Math.round((rawDropVolts / input.voltage) * 10000) / 100 : 0;

  const isVoltageDropOk = voltageDropPercent <= input.maxVoltageDropPercent;

  // Поиск минимально рекомендуемого сечения для компенсации ΔU
  let recommendedSectionForDropMm2: number | null = null;
  if (!isVoltageDropOk && activeBreakerIn > 0 && input.lengthMeters > 0) {
    const maxAllowedDropVolts = (input.voltage * input.maxVoltageDropPercent) / 100;
    const minRequiredS =
      (lengthMultiplier * activeBreakerIn * input.lengthMeters * rho) / maxAllowedDropVolts;

    const availableSections = STANDARD_SECTIONS.filter(
      (s) =>
        (input.material === ConductorMaterial.COPPER || s >= 2.5) &&
        s >= minRequiredS &&
        s > input.sectionMm2
    );
    recommendedSectionForDropMm2 =
      availableSections.length > 0 ? availableSections[0] : 240.0;
  }

  // 5. Проверка по току короткого замыкания (петля «фаза-ноль»)
  const curveMultiplier =
    input.breakerCurve === BreakerCurve.B
      ? 5.5
      : input.breakerCurve === BreakerCurve.C
      ? 11.0
      : 22.0;

  const minShortCircuitCurrentA = Math.round(activeBreakerIn * curveMultiplier * 10) / 10;

  // Фазное напряжение для петли «фаза-ноль»
  const phaseVoltage =
    input.phases === PhaseCount.THREE_PHASE
      ? input.voltage >= 390
        ? 230
        : 220
      : input.voltage;

  const maxLoopImpedanceOhm =
    minShortCircuitCurrentA > 0
      ? Math.round((phaseVoltage / minShortCircuitCurrentA) * 1000) / 1000
      : 0;

  // Ориентировочная предельная длина линии от щита/ТП (с учетом ~25% запаса на сопротивление ТП и питающей сети)
  const usableCableImpedance = maxLoopImpedanceOhm * 0.75;
  const estimatedMaxLineLengthByScMeters =
    usableCableImpedance > 0 && rho > 0
      ? Math.max(0, Math.round((usableCableImpedance * input.sectionMm2) / (2 * rho)))
      : 0;

  // 6. Инженерные предупреждения
  const warnings: EngineeringWarning[] = [];

  if (input.material === ConductorMaterial.ALUMINUM && input.sectionMm2 < 16.0) {
    warnings.push({
      id: 'al-under-16',
      severity: 'warning',
      title: 'Ограничение применения алюминия < 16 мм²',
      clause: 'ПУЭ 7-е изд., п. 7.1.34 / Табл. 7.1.1',
      description:
        'В жилых и общественных зданиях питающие и распределительные линии должны выполняться медными кабелями. Применение алюминиевых жил стандартных сплавов допускается только при сечении не менее 16 мм².',
    });
  }

  if (input.sectionMm2 < 1.5) {
    warnings.push({
      id: 'section-under-1-5',
      severity: 'error',
      title: 'Сечение 0.5–1.0 мм² не для стационарной электропроводки',
      clause: 'ПУЭ п. 7.1.34 / ГОСТ Р 50571.5.52',
      description:
        'Наименьшее допустимое сечение медных проводников для групповых стационарных линий (освещение и силовые цепи) в зданиях составляет 1.5 мм². Сечения 0.5–0.75 мм² применяются только для гибких шнуров переносных электроприборов и цепей управления.',
    });
  }

  if (!isVoltageDropOk) {
    warnings.push({
      id: 'voltage-drop-exceeded',
      severity: 'error',
      title: `Превышение допустимых потерь напряжения (ΔU = ${voltageDropPercent}%)`,
      clause: 'ПУЭ п. 7.1.13 / ГОСТ Р 50571.5.52',
      description: recommendedSectionForDropMm2
        ? `Падение напряжения ${voltageDropPercent}% (${voltageDropVolts} В) превышает норму ${input.maxVoltageDropPercent}%. Для компенсации потерь на трассе ${input.lengthMeters} м рекомендуется увеличить сечение минимум до ${recommendedSectionForDropMm2} мм².`
        : `Падение напряжения ${voltageDropPercent}% (${voltageDropVolts} В) превышает норму ${input.maxVoltageDropPercent}%. Рекомендуется уменьшить длину трассы или применить параллельные кабели.`,
    });
  }

  if (
    !input.strictOverloadMargin &&
    strictOverloadBreakerIn < recommendedBreakerIn &&
    recommendedBreakerIn > 0
  ) {
    warnings.push({
      id: 'thermal-trip-margin',
      severity: 'info',
      title: `Запас по току расцепления I₂ = 1.45·In (${thermalTripCurrentI2} А)`,
      clause: 'ПУЭ п. 3.1.11 / ГОСТ Р 50571.4.43',
      description: `По базовому условию In ≤ Iдд подходит автомат ${recommendedBreakerIn} А, но его ток условного расцепления I₂ = ${thermalTripCurrentI2} А превышает длительный ток кабеля Iдд = ${effectiveAmpacity} А. Для полной защиты кабеля от длительных малых перегрузок рекомендуется номинал ${strictOverloadBreakerIn} А (включите тумблер «Запас 1.45·In ≤ Iдд»).`,
    });
  }

  if (
    input.lengthMeters > 0 &&
    estimatedMaxLineLengthByScMeters > 0 &&
    input.lengthMeters > estimatedMaxLineLengthByScMeters
  ) {
    warnings.push({
      id: 'sc-loop-length',
      severity: 'warning',
      title: 'Риск несрабатывания ЭМР при однофазном КЗ в конце линии',
      clause: 'ПУЭ п. 1.7.79',
      description: `Длина линии (${input.lengthMeters} м) превышает ориентировочную предельную длину по условию мгновенного отключения КЗ (~${estimatedMaxLineLengthByScMeters} м для характеристики ${input.breakerCurve}${activeBreakerIn}). Проверьте сопротивление петли «фаза-ноль» (не более ${maxLoopImpedanceOhm} Ом) или выберите характеристику с меньшей кратностью (например, B вместо C).`,
    });
  }

  // 7. Строка спецификации
  const matLabel = input.material === ConductorMaterial.COPPER ? 'Медь' : 'Алюминий';
  const insLabel = input.insulation === InsulationType.PVC_70 ? 'ПВХ' : 'СПЭ';
  const methodLabel =
    input.installationMethod === InstallationMethod.OPEN_AIR
      ? 'открыто'
      : input.installationMethod === InstallationMethod.CONDUIT
      ? 'скрыто'
      : 'в земле';

  const coresPrefix =
    input.loadedCores === LoadedCores.ONE
      ? '1х'
      : input.loadedCores === LoadedCores.TWO
      ? '2х'
      : '3х';

  const specificationString = `Расчет линии: ${matLabel} (${insLabel}) ${coresPrefix}${input.sectionMm2} мм², прокладка ${methodLabel}, L=${input.lengthMeters} м | Iдд = ${effectiveAmpacity} А | Автомат: ${input.breakerCurve}${activeBreakerIn} (Pмакс = ${maxPowerByBreakerKw} кВт) | Потери ΔU = ${voltageDropPercent}% (${voltageDropVolts} В) | Мин. ток КЗ = ${minShortCircuitCurrentA} А (Zпетли ≤ ${maxLoopImpedanceOhm} Ом)`;

  return {
    baseAmpacity,
    tempFactor,
    bundleFactor,
    effectiveAmpacity,
    recommendedBreakerIn,
    strictOverloadBreakerIn,
    activeBreakerIn,
    thermalNonTripCurrentI1,
    thermalTripCurrentI2,
    cableOverloadLimit145,
    cableLoadRatioPercent,
    isOverloadProtected,
    maxPowerByBreakerKw,
    maxPowerByCableKw,
    voltageDropVolts,
    voltageDropPercent,
    isVoltageDropOk,
    recommendedSectionForDropMm2,
    minShortCircuitCurrentA,
    curveMultiplier,
    maxLoopImpedanceOhm,
    estimatedMaxLineLengthByScMeters,
    specificationString,
    warnings,
  };
}

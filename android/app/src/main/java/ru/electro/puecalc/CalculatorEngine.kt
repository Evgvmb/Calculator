package ru.electro.puecalc

import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.math.sqrt

data class CalculatorInput(
    val material: ConductorMaterial = ConductorMaterial.COPPER,
    val insulation: InsulationType = InsulationType.PVC_70,
    val sectionMm2: Double = 2.5,
    val phases: PhaseCount = PhaseCount.SINGLE_PHASE,
    val voltage: Int = 230,
    val cosPhi: Double = 0.95,
    val installationMethod: InstallationMethod = InstallationMethod.CONDUIT,
    val loadedCores: LoadedCores = LoadedCores.TWO,
    val lengthMeters: Double = 25.0,
    val maxVoltageDropPercent: Double = 5.0,
    val ambientTempC: Int = 25,
    val bundleCount: BundleCount = BundleCount.SINGLE,
    val breakerCurve: BreakerCurve = BreakerCurve.C,
    val strictOverloadMargin: Boolean = false
)

enum class WarningSeverity {
    INFO, WARNING, ERROR
}

data class EngineeringWarning(
    val title: String,
    val clause: String,
    val message: String,
    val severity: WarningSeverity
)

data class CalculationResult(
    val baseAmpacity: Double,
    val tempFactor: Double,
    val bundleFactor: Double,
    val effectiveAmpacity: Double,
    val recommendedBreakerIn: Int,
    val strictOverloadBreakerIn: Int,
    val activeBreakerIn: Int,
    val thermalNonTripI1: Double,
    val thermalTripI2: Double,
    val cableOverloadLimit145: Double,
    val cableLoadRatio: Float,
    val isOverloadProtected: Boolean,
    val maxPowerBreakerKw: Double,
    val maxPowerCableKw: Double,
    val voltageDropVolts: Double,
    val voltageDropPercent: Double,
    val isVoltageDropOk: Boolean,
    val recommendedSectionForDropMm2: Double?,
    val minShortCircuitCurrentA: Double,
    val maxLoopImpedanceOhm: Double,
    val estimatedMaxLengthByScMeters: Int,
    val specificationString: String,
    val warnings: List<EngineeringWarning>
)

object CalculatorEngine {

    fun calculate(input: CalculatorInput): CalculationResult {
        // 1. Длительно допустимый ток кабеля Iдд с учетом Табл. 1.3.3 и 1.3.26 ПУЭ
        val baseAmpacity = PueTables.getBaseAmpacity(
            material = input.material,
            insulation = input.insulation,
            section = input.sectionMm2,
            method = input.installationMethod,
            cores = input.loadedCores
        )

        val tempFactor = PueTables.getTemperatureFactor(
            insulation = input.insulation,
            method = input.installationMethod,
            ambientTempC = input.ambientTempC
        )

        val bundleFactor = input.bundleCount.factor
        val effectiveAmpacity = ((baseAmpacity * tempFactor * bundleFactor) * 10.0).roundToInt() / 10.0

        // 2. Подбор автоматического выключателя In <= Iдд
        val recommendedBreakerIn = PueTables.STANDARD_BREAKERS
            .lastOrNull { it <= effectiveAmpacity } ?: 0

        // Проверка условия защиты от перегрузки с запасом 1.45 * In <= Iдд (ПУЭ п. 3.1.11 / ГОСТ Р 50571.4.43)
        val strictOverloadBreakerIn = PueTables.STANDARD_BREAKERS
            .lastOrNull { it * 1.45 <= effectiveAmpacity } ?: recommendedBreakerIn

        val activeBreakerIn = if (input.strictOverloadMargin) {
            strictOverloadBreakerIn
        } else {
            recommendedBreakerIn
        }

        val thermalNonTripI1 = ((activeBreakerIn * 1.13) * 10.0).roundToInt() / 10.0
        val thermalTripI2 = ((activeBreakerIn * 1.45) * 10.0).roundToInt() / 10.0
        val cableOverloadLimit145 = ((effectiveAmpacity * 1.45) * 10.0).roundToInt() / 10.0

        val cableLoadRatio = if (effectiveAmpacity > 0.0) {
            min(1.0f, (activeBreakerIn / effectiveAmpacity).toFloat())
        } else {
            0f
        }

        val isOverloadProtected = activeBreakerIn > 0 &&
                activeBreakerIn <= effectiveAmpacity &&
                thermalTripI2 <= cableOverloadLimit145 + 0.05

        // 3. Расчет мощности P (кВт)
        val phaseFactor = if (input.phases == PhaseCount.THREE_PHASE) sqrt(3.0) else 1.0
        val maxPowerBreakerKw =
            (((phaseFactor * input.voltage * activeBreakerIn * input.cosPhi) / 1000.0) * 100.0).roundToInt() / 100.0
        val maxPowerCableKw =
            (((phaseFactor * input.voltage * effectiveAmpacity * input.cosPhi) / 1000.0) * 100.0).roundToInt() / 100.0

        // 4. Расчет потерь напряжения ΔU (Вольты и %)
        val rho = PueTables.getWorkingResistivity(input.material, input.insulation)
        val dropPhaseMultiplier = if (input.phases == PhaseCount.SINGLE_PHASE) 2.0 else sqrt(3.0)

        val rawDropVolts = if (input.sectionMm2 > 0 && activeBreakerIn > 0 && input.lengthMeters > 0) {
            (dropPhaseMultiplier * activeBreakerIn * input.lengthMeters * rho) / input.sectionMm2
        } else {
            0.0
        }

        val voltageDropVolts = (rawDropVolts * 100.0).roundToInt() / 100.0
        val voltageDropPercent = if (input.voltage > 0) {
            ((rawDropVolts / input.voltage) * 100.0 * 100.0).roundToInt() / 100.0
        } else {
            0.0
        }

        val isVoltageDropOk = voltageDropPercent <= input.maxVoltageDropPercent

        // Рекомендуемое сечение для компенсации потерь напряжения
        val recommendedSectionForDropMm2: Double? = if (!isVoltageDropOk && activeBreakerIn > 0 && input.lengthMeters > 0) {
            val maxAllowedDropVolts = (input.voltage * input.maxVoltageDropPercent) / 100.0
            val minRequiredS = (dropPhaseMultiplier * activeBreakerIn * input.lengthMeters * rho) / maxAllowedDropVolts
            PueTables.STANDARD_SECTIONS.firstOrNull { s ->
                (input.material == ConductorMaterial.COPPER || s >= 2.5) &&
                        s >= minRequiredS &&
                        s > input.sectionMm2
            } ?: 240.0
        } else {
            null
        }

        // 5. Проверка по току короткого замыкания (петля «фаза-ноль»)
        val minShortCircuitCurrentA =
            ((activeBreakerIn * input.breakerCurve.emrMultiplierWithMargin) * 10.0).roundToInt() / 10.0

        val phaseVoltage = if (input.phases == PhaseCount.THREE_PHASE) {
            if (input.voltage >= 390) 230.0 else 220.0
        } else {
            input.voltage.toDouble()
        }

        val maxLoopImpedanceOhm = if (minShortCircuitCurrentA > 0) {
            ((phaseVoltage / minShortCircuitCurrentA) * 1000.0).roundToInt() / 1000.0
        } else {
            0.0
        }

        val usableCableImpedance = maxLoopImpedanceOhm * 0.75
        val estimatedMaxLengthByScMeters = if (usableCableImpedance > 0 && rho > 0) {
            ((usableCableImpedance * input.sectionMm2) / (2.0 * rho)).roundToInt()
        } else {
            0
        }

        // 6. Формирование инженерных предупреждений
        val warnings = mutableListOf<EngineeringWarning>()

        if (input.material == ConductorMaterial.ALUMINUM && input.sectionMm2 < 16.0) {
            warnings.add(
                EngineeringWarning(
                    title = "Запрет алюминия < 16 мм² в жилых и общественных зданиях",
                    clause = "ПУЭ п. 7.1.34 / Табл. 7.1.1",
                    message = "Питающие и распределительные линии в жилых и общественных зданиях должны выполняться медными кабелями. Алюминий допускается только сечением от 16 мм².",
                    severity = WarningSeverity.WARNING
                )
            )
        }

        if (input.sectionMm2 < 1.5) {
            warnings.add(
                EngineeringWarning(
                    title = "Сечение ${input.sectionMm2} мм² недопустимо для стационарной проводки",
                    clause = "ПУЭ п. 7.1.34 / ГОСТ Р 50571.5.52",
                    message = "Минимальное сечение медных жил для стационарной групповой сети освещения и розеток — 1.5 мм². Сечения 0.5–0.75 мм² предназначены только для гибких шнуров переносных приборов.",
                    severity = WarningSeverity.ERROR
                )
            )
        }

        if (!isVoltageDropOk) {
            val recText = recommendedSectionForDropMm2?.let { "Рекомендуется увеличить сечение минимум до $it мм²." }
                ?: "Уменьшите длину линии или разделите нагрузку."
            warnings.add(
                EngineeringWarning(
                    title = "Превышение потерь напряжения ΔU = $voltageDropPercent%",
                    clause = "ПУЭ п. 7.1.13",
                    message = "Потери напряжения ($voltageDropVolts В / $voltageDropPercent%) превышают допуск ${input.maxVoltageDropPercent}%. $recText",
                    severity = WarningSeverity.ERROR
                )
            )
        }

        if (!input.strictOverloadMargin && strictOverloadBreakerIn < recommendedBreakerIn && recommendedBreakerIn > 0) {
            warnings.add(
                EngineeringWarning(
                    title = "Рекомендация по тепловому расцепителю (I₂ = 1.45·In)",
                    clause = "ПУЭ п. 3.1.11 / ГОСТ Р 50571.4.43",
                    message = "Ток условного расцепления автомата $recommendedBreakerIn А составляет $thermalTripI2 А, что выше Iдд = $effectiveAmpacity А. Для исключения перегрева при затяжных перегрузках рекомендуется номинал $strictOverloadBreakerIn А.",
                    severity = WarningSeverity.INFO
                )
            )
        }

        // 7. Строка спецификации для копирования и отправки
        val methodShort = when (input.installationMethod) {
            InstallationMethod.OPEN_AIR -> "открыто"
            InstallationMethod.CONDUIT -> "скрыто"
            InstallationMethod.GROUND -> "в земле"
        }
        val insShort = if (input.insulation == InsulationType.PVC_70) "ПВХ" else "СПЭ"
        val sectionFormatted = if (input.sectionMm2 % 1.0 == 0.0) {
            input.sectionMm2.toInt().toString()
        } else {
            input.sectionMm2.toString()
        }

        val specificationString =
            "Расчет линии: ${input.material.title} ($insShort) ${input.loadedCores.prefix}$sectionFormatted мм², " +
                    "прокладка $methodShort, L=${input.lengthMeters.toInt()} м | " +
                    "Iдд = $effectiveAmpacity А | " +
                    "Автомат: ${input.breakerCurve.code}$activeBreakerIn (Pмакс = $maxPowerBreakerKw кВт) | " +
                    "Потери ΔU = $voltageDropPercent% | " +
                    "Мин. ток КЗ = ${minShortCircuitCurrentA.toInt()} А"

        return CalculationResult(
            baseAmpacity = baseAmpacity,
            tempFactor = tempFactor,
            bundleFactor = bundleFactor,
            effectiveAmpacity = effectiveAmpacity,
            recommendedBreakerIn = recommendedBreakerIn,
            strictOverloadBreakerIn = strictOverloadBreakerIn,
            activeBreakerIn = activeBreakerIn,
            thermalNonTripI1 = thermalNonTripI1,
            thermalTripI2 = thermalTripI2,
            cableOverloadLimit145 = cableOverloadLimit145,
            cableLoadRatio = cableLoadRatio,
            isOverloadProtected = isOverloadProtected,
            maxPowerBreakerKw = maxPowerBreakerKw,
            maxPowerCableKw = maxPowerCableKw,
            voltageDropVolts = voltageDropVolts,
            voltageDropPercent = voltageDropPercent,
            isVoltageDropOk = isVoltageDropOk,
            recommendedSectionForDropMm2 = recommendedSectionForDropMm2,
            minShortCircuitCurrentA = minShortCircuitCurrentA,
            maxLoopImpedanceOhm = maxLoopImpedanceOhm,
            estimatedMaxLengthByScMeters = estimatedMaxLengthByScMeters,
            specificationString = specificationString,
            warnings = warnings
        )
    }
}

package ru.electro.puecalc

import kotlin.math.roundToInt
import kotlin.math.sqrt

enum class ConductorMaterial(val title: String, val symbol: String) {
    COPPER("Медь", "Cu"),
    ALUMINUM("Алюминий", "Al")
}

enum class InsulationType(val title: String, val shortTitle: String, val maxTempC: Int) {
    PVC_70("ПВХ-изоляция (ВВГ, АВВГ — до +70°C)", "ПВХ (+70°C)", 70),
    XLPE_90("Сшитый полиэтилен / Резина (ПвВГ, КГ — до +90°C)", "СПЭ (+90°C)", 90)
}

enum class InstallationMethod(val title: String, val normTempC: Int) {
    OPEN_AIR("Открыто (воздух / лотки)", 25),
    CONDUIT("Скрыто (штроба / труба / гофра)", 25),
    GROUND("В земле (траншее)", 15)
}

enum class LoadedCores(val count: Int, val title: String, val prefix: String) {
    ONE(1, "Одножильный (1х)", "1х"),
    TWO(2, "Двухжильный (2х)", "2х"),
    THREE(3, "Трехжильный (3х)", "3х")
}

enum class PhaseCount(val count: Int, val title: String, val defaultVoltage: Int) {
    SINGLE_PHASE(1, "1 фаза (220/230 В)", 230),
    THREE_PHASE(3, "3 фазы (380/400 В)", 400)
}

enum class BreakerCurve(
    val code: String,
    val emrMultiplierWithMargin: Double,
    val description: String
) {
    B("B", 5.5, "Освещение, протяженные линии, ТЭНы (ЭМР: 3–5 In)"),
    C("C", 11.0, "Универсальная: розетки, бытовая и смешанная нагрузка (ЭМР: 5–10 In)"),
    D("D", 22.0, "Электродвигатели, насосы, сварочные аппараты с высокими пусковыми токами (ЭМР: 10–20 In)")
}

enum class BundleCount(val label: String, val description: String, val factor: Double) {
    SINGLE("1", "Одиночная прокладка (K = 1.00)", 1.00),
    TWO("2", "2 кабеля в пучке/трубе (K = 0.85)", 0.85),
    THREE("3", "3 кабеля в пучке/трубе (K = 0.79)", 0.79),
    FOUR("4", "4 кабеля в пучке/трубе (K = 0.75)", 0.75),
    FIVE_SIX("5–6", "5–6 кабелей в пучке/лотке (K = 0.70)", 0.70),
    SEVEN_NINE("7–9", "7–9 кабелей в пучке/лотке (K = 0.65)", 0.65)
}

data class AmpacityRow(
    val open1: Double,
    val open2: Double,
    val open3: Double,
    val conduit1: Double,
    val conduit2: Double,
    val conduit3: Double,
    val ground1: Double,
    val ground2: Double,
    val ground3: Double
)

object PueTables {

    val STANDARD_SECTIONS: List<Double> = listOf(
        0.5, 0.75, 1.0, 1.5, 2.5, 4.0, 6.0, 10.0, 16.0,
        25.0, 35.0, 50.0, 70.0, 95.0, 120.0, 150.0, 185.0, 240.0
    )

    val STANDARD_BREAKERS: List<Int> = listOf(
        1, 2, 3, 4, 6, 10, 13, 16, 20, 25, 32, 40,
        50, 63, 80, 100, 125, 160, 200, 250, 320, 400, 500, 630
    )

    // ПУЭ 7-е издание, Табл. 1.3.4 и 1.3.6 — Медь (Cu), ПВХ (+70°C)
    val copperPvcTable: Map<Double, AmpacityRow> = mapOf(
        0.5 to AmpacityRow(11.0, 9.5, 8.5, 9.5, 8.0, 7.5, 14.0, 12.0, 11.0),
        0.75 to AmpacityRow(15.0, 13.0, 11.5, 13.0, 11.0, 10.0, 19.0, 16.0, 14.0),
        1.0 to AmpacityRow(17.0, 16.0, 14.0, 16.0, 15.0, 14.0, 23.0, 20.0, 18.0),
        1.5 to AmpacityRow(23.0, 19.0, 17.0, 19.0, 18.0, 15.0, 31.0, 27.0, 23.0),
        2.5 to AmpacityRow(30.0, 27.0, 25.0, 27.0, 21.0, 19.0, 42.0, 38.0, 33.0),
        4.0 to AmpacityRow(41.0, 38.0, 35.0, 38.0, 32.0, 27.0, 55.0, 49.0, 43.0),
        6.0 to AmpacityRow(50.0, 46.0, 42.0, 46.0, 38.0, 34.0, 69.0, 60.0, 53.0),
        10.0 to AmpacityRow(80.0, 70.0, 60.0, 70.0, 55.0, 50.0, 95.0, 85.0, 75.0),
        16.0 to AmpacityRow(100.0, 85.0, 80.0, 85.0, 75.0, 70.0, 125.0, 110.0, 100.0),
        25.0 to AmpacityRow(140.0, 115.0, 100.0, 115.0, 95.0, 85.0, 165.0, 145.0, 130.0),
        35.0 to AmpacityRow(170.0, 135.0, 125.0, 135.0, 120.0, 100.0, 200.0, 175.0, 160.0),
        50.0 to AmpacityRow(215.0, 175.0, 160.0, 185.0, 145.0, 135.0, 245.0, 215.0, 195.0),
        70.0 to AmpacityRow(270.0, 215.0, 195.0, 225.0, 180.0, 165.0, 300.0, 265.0, 240.0),
        95.0 to AmpacityRow(325.0, 260.0, 230.0, 275.0, 220.0, 200.0, 360.0, 315.0, 285.0),
        120.0 to AmpacityRow(385.0, 300.0, 260.0, 315.0, 260.0, 235.0, 410.0, 360.0, 325.0),
        150.0 to AmpacityRow(440.0, 340.0, 295.0, 360.0, 305.0, 275.0, 465.0, 405.0, 365.0),
        185.0 to AmpacityRow(510.0, 395.0, 340.0, 415.0, 350.0, 315.0, 520.0, 455.0, 410.0),
        240.0 to AmpacityRow(605.0, 465.0, 405.0, 490.0, 415.0, 375.0, 600.0, 525.0, 470.0)
    )

    // ПУЭ 7-е издание, Табл. 1.3.5 и 1.3.7 — Алюминий (Al), ПВХ (+70°C)
    val aluminumPvcTable: Map<Double, AmpacityRow> = mapOf(
        2.5 to AmpacityRow(24.0, 20.0, 19.0, 20.0, 16.0, 15.0, 32.0, 29.0, 25.0),
        4.0 to AmpacityRow(32.0, 28.0, 27.0, 28.0, 24.0, 21.0, 42.0, 38.0, 33.0),
        6.0 to AmpacityRow(39.0, 36.0, 32.0, 36.0, 29.0, 26.0, 53.0, 46.0, 41.0),
        10.0 to AmpacityRow(60.0, 50.0, 47.0, 50.0, 42.0, 38.0, 73.0, 65.0, 58.0),
        16.0 to AmpacityRow(75.0, 60.0, 60.0, 60.0, 55.0, 55.0, 96.0, 85.0, 77.0),
        25.0 to AmpacityRow(105.0, 85.0, 75.0, 85.0, 70.0, 65.0, 127.0, 112.0, 100.0),
        35.0 to AmpacityRow(130.0, 100.0, 95.0, 100.0, 90.0, 75.0, 154.0, 135.0, 123.0),
        50.0 to AmpacityRow(165.0, 135.0, 125.0, 140.0, 110.0, 105.0, 189.0, 165.0, 150.0),
        70.0 to AmpacityRow(210.0, 165.0, 150.0, 175.0, 140.0, 130.0, 231.0, 204.0, 185.0),
        95.0 to AmpacityRow(255.0, 200.0, 175.0, 215.0, 170.0, 155.0, 277.0, 243.0, 220.0),
        120.0 to AmpacityRow(295.0, 230.0, 200.0, 245.0, 200.0, 180.0, 316.0, 277.0, 250.0),
        150.0 to AmpacityRow(340.0, 260.0, 225.0, 275.0, 235.0, 210.0, 358.0, 312.0, 280.0),
        185.0 to AmpacityRow(390.0, 305.0, 260.0, 320.0, 270.0, 245.0, 400.0, 350.0, 315.0),
        240.0 to AmpacityRow(465.0, 355.0, 310.0, 375.0, 320.0, 290.0, 462.0, 404.0, 362.0)
    )

    fun getBaseAmpacity(
        material: ConductorMaterial,
        insulation: InsulationType,
        section: Double,
        method: InstallationMethod,
        cores: LoadedCores
    ): Double {
        val table = if (material == ConductorMaterial.COPPER) copperPvcTable else aluminumPvcTable
        val row = table[section] ?: return 0.0

        val pvcCurrent = when (method) {
            InstallationMethod.OPEN_AIR -> when (cores) {
                LoadedCores.ONE -> row.open1
                LoadedCores.TWO -> row.open2
                LoadedCores.THREE -> row.open3
            }
            InstallationMethod.CONDUIT -> when (cores) {
                LoadedCores.ONE -> row.conduit1
                LoadedCores.TWO -> row.conduit2
                LoadedCores.THREE -> row.conduit3
            }
            InstallationMethod.GROUND -> when (cores) {
                LoadedCores.ONE -> row.ground1
                LoadedCores.TWO -> row.ground2
                LoadedCores.THREE -> row.ground3
            }
        }

        // Для изоляции из сшитого полиэтилена (СПЭ +90°C) повышающий коэффициент по ГОСТ 31996 / ПУЭ
        return if (insulation == InsulationType.XLPE_90) {
            val factor = if (method == InstallationMethod.GROUND) 1.13 else 1.18
            ((pvcCurrent * factor) * 10.0).roundToInt() / 10.0
        } else {
            pvcCurrent
        }
    }

    // Таблица 1.3.3 ПУЭ — Поправочный коэффициент на температуру среды
    fun getTemperatureFactor(
        insulation: InsulationType,
        method: InstallationMethod,
        ambientTempC: Int
    ): Double {
        val tMax = insulation.maxTempC.toDouble()
        val tNorm = method.normTempC.toDouble()
        if (ambientTempC >= tMax - 2) return 0.25

        val ratio = (tMax - ambientTempC) / (tMax - tNorm)
        if (ratio <= 0.0) return 0.25

        return (sqrt(ratio) * 100.0).roundToInt() / 100.0
    }

    // Удельное сопротивление при рабочей температуре жилы (Ом·мм²/м)
    fun getWorkingResistivity(
        material: ConductorMaterial,
        insulation: InsulationType
    ): Double {
        return when (material) {
            ConductorMaterial.COPPER -> if (insulation == InsulationType.PVC_70) 0.0225 else 0.0240
            ConductorMaterial.ALUMINUM -> if (insulation == InsulationType.PVC_70) 0.0360 else 0.0385
        }
    }
}

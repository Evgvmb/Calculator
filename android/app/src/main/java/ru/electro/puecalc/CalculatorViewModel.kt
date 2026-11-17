package ru.electro.puecalc

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update

class CalculatorViewModel : ViewModel() {

    private val _inputState = MutableStateFlow(CalculatorInput())
    val inputState: StateFlow<CalculatorInput> = _inputState.asStateFlow()

    // Реактивный пересчет при любом изменении входных параметров без кнопки «Рассчитать»
    val resultState: StateFlow<CalculationResult> = _inputState
        .map { input -> CalculatorEngine.calculate(input) }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = CalculatorEngine.calculate(_inputState.value)
        )

    fun setMaterial(material: ConductorMaterial) {
        _inputState.update { current ->
            // Для алюминия по ПУЭ сечения < 2.5 мм² не выпускаются и запрещены
            val adjustedSection = if (material == ConductorMaterial.ALUMINUM && current.sectionMm2 < 2.5) {
                2.5
            } else {
                current.sectionMm2
            }
            current.copy(material = material, sectionMm2 = adjustedSection)
        }
    }

    fun setInsulation(insulation: InsulationType) {
        _inputState.update { it.copy(insulation = insulation) }
    }

    fun setSection(sectionMm2: Double) {
        _inputState.update { current ->
            if (current.material == ConductorMaterial.ALUMINUM && sectionMm2 < 2.5) {
                current
            } else {
                current.copy(sectionMm2 = sectionMm2)
            }
        }
    }

    fun setPhases(phases: PhaseCount) {
        _inputState.update { current ->
            val defaultVoltage = phases.defaultVoltage
            val defaultCores = if (phases == PhaseCount.THREE_PHASE) LoadedCores.THREE else LoadedCores.TWO
            current.copy(
                phases = phases,
                voltage = defaultVoltage,
                loadedCores = defaultCores
            )
        }
    }

    fun setVoltage(voltage: Int) {
        _inputState.update { it.copy(voltage = voltage) }
    }

    fun setCosPhi(cosPhi: Double) {
        val clamped = cosPhi.coerceIn(0.50, 1.00)
        _inputState.update { it.copy(cosPhi = clamped) }
    }

    fun setInstallationMethod(method: InstallationMethod) {
        _inputState.update { current ->
            // При смене воздух <-> земля автоматически подставляем нормируемую температуру (+25°C или +15°C),
            // если стояла стандартная температура предыдущего режима
            val newTemp = if (current.ambientTempC == current.installationMethod.normTempC) {
                method.normTempC
            } else {
                current.ambientTempC
            }
            current.copy(installationMethod = method, ambientTempC = newTemp)
        }
    }

    fun setLoadedCores(cores: LoadedCores) {
        _inputState.update { it.copy(loadedCores = cores) }
    }

    fun setLengthMeters(lengthText: String) {
        val parsed = lengthText.replace(',', '.').toDoubleOrNull()?.coerceIn(0.0, 10_000.0) ?: 0.0
        _inputState.update { it.copy(lengthMeters = parsed) }
    }

    fun setMaxVoltageDropPercent(dropPercent: Double) {
        _inputState.update { it.copy(maxVoltageDropPercent = dropPercent) }
    }

    fun setAmbientTempC(tempC: Int) {
        _inputState.update { it.copy(ambientTempC = tempC.coerceIn(-30, 65)) }
    }

    fun setBundleCount(bundleCount: BundleCount) {
        _inputState.update { it.copy(bundleCount = bundleCount) }
    }

    fun setBreakerCurve(curve: BreakerCurve) {
        _inputState.update { it.copy(breakerCurve = curve) }
    }

    fun setStrictOverloadMargin(enabled: Boolean) {
        _inputState.update { it.copy(strictOverloadMargin = enabled) }
    }

    fun applyRecommendedSectionForDrop() {
        val recommended = resultState.value.recommendedSectionForDropMm2 ?: return
        setSection(recommended)
    }
}

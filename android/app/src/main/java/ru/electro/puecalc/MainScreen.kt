package ru.electro.puecalc

import android.content.Intent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Slider
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import kotlin.math.roundToInt

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun MainScreen(
    viewModel: CalculatorViewModel,
    isDarkTheme: Boolean,
    onToggleTheme: () -> Unit
) {
    val input by viewModel.inputState.collectAsState()
    val result by viewModel.resultState.collectAsState()

    val clipboardManager = LocalClipboardManager.current
    val context = LocalContext.current
    val snackbarHostState = remember { SnackbarHostState() }
    val coroutineScope = rememberCoroutineScope()

    var lengthText by rememberSaveable { mutableStateOf(input.lengthMeters.toInt().toString()) }
    var conditionsExpanded by rememberSaveable { mutableStateOf(false) }

    Scaffold(
        snackbarHost = { SnackbarHost(hostState = snackbarHostState) },
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "ПУЭ-7: Автомат и Кабель",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Табл. 1.3.4–1.3.7, 1.3.3, 1.3.26 (Офлайн)",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                actions = {
                    TextButton(onClick = onToggleTheme) {
                        Text(if (isDarkTheme) "Светлая" else "Темная")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // 1. ГЛАВНЫЙ БЛОК РЕЗУЛЬТАТА (HERO CARD)
            HeroBreakerCard(
                input = input,
                result = result,
                onCurveSelected = viewModel::setBreakerCurve,
                onStrictMarginChanged = viewModel::setStrictOverloadMargin
            )

            // 2. ДИНАМИЧЕСКИЕ ИНЖЕНЕРНЫЕ ПРЕДУПРЕЖДЕНИЯ
            result.warnings.forEach { warning ->
                WarningBannerCard(
                    warning = warning,
                    recommendedSection = if (warning.clause.contains("7.1.13")) {
                        result.recommendedSectionForDropMm2
                    } else null,
                    onApplyRecommendedSection = viewModel::applyRecommendedSectionForDrop
                )
            }

            // 3. ВХОДНЫЕ ПАРАМЕТРЫ ЛИНИИ
            OutlinedCard(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text(
                        text = "Параметры кабельной линии",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )

                    // Материал жилы (SegmentedButton)
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(
                            text = "Материал токопроводящей жилы",
                            style = MaterialTheme.typography.labelLarge
                        )
                        SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                            ConductorMaterial.entries.forEachIndexed { index, mat ->
                                SegmentedButton(
                                    selected = input.material == mat,
                                    onClick = { viewModel.setMaterial(mat) },
                                    shape = SegmentedButtonDefaults.itemShape(
                                        index = index,
                                        count = ConductorMaterial.entries.size
                                    )
                                ) {
                                    Text("${mat.title} (${mat.symbol})")
                                }
                            }
                        }
                    }

                    // Тип изоляции (SegmentedButton)
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(
                            text = "Тип изоляции и макс. температура жилы",
                            style = MaterialTheme.typography.labelLarge
                        )
                        SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                            InsulationType.entries.forEachIndexed { index, ins ->
                                SegmentedButton(
                                    selected = input.insulation == ins,
                                    onClick = { viewModel.setInsulation(ins) },
                                    shape = SegmentedButtonDefaults.itemShape(
                                        index = index,
                                        count = InsulationType.entries.size
                                    )
                                ) {
                                    Text(ins.shortTitle)
                                }
                            }
                        }
                        Text(
                            text = input.insulation.title,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    // Сечение жилы (мм²) — сетка чипов с блокировкой < 2.5 мм² для Al
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Сечение жилы S (мм²)",
                                style = MaterialTheme.typography.labelLarge
                            )
                            Text(
                                text = "Выбрано: ${input.sectionMm2} мм²",
                                style = MaterialTheme.typography.labelLarge,
                                color = MaterialTheme.colorScheme.primary,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        if (input.material == ConductorMaterial.ALUMINUM) {
                            Text(
                                text = "По ПУЭ (Табл. 1.3.5 / 7.1.1) алюминиевые жилы сечением менее 2.5 мм² не применяются и заблокированы.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.tertiary
                            )
                        }

                        FlowRow(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            PueTables.STANDARD_SECTIONS.forEach { sec ->
                                val isBlockedForAl =
                                    input.material == ConductorMaterial.ALUMINUM && sec < 2.5
                                val label = if (sec % 1.0 == 0.0) sec.toInt().toString() else sec.toString()

                                FilterChip(
                                    selected = input.sectionMm2 == sec,
                                    onClick = { viewModel.setSection(sec) },
                                    enabled = !isBlockedForAl,
                                    label = {
                                        Text(
                                            text = label,
                                            fontFamily = FontFamily.Monospace,
                                            fontWeight = if (input.sectionMm2 == sec) FontWeight.Bold else FontWeight.Normal
                                        )
                                    },
                                    leadingIcon = if (input.sectionMm2 == sec) {
                                        { Icon(Icons.Default.Check, contentDescription = null) }
                                    } else null
                                )
                            }
                        }
                    }

                    HorizontalDivider()

                    // Способ прокладки и количество нагруженных жил
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = "Способ прокладки кабеля",
                            style = MaterialTheme.typography.labelLarge
                        )
                        SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                            val shortLabels = listOf("Открыто", "Скрыто / Труба", "В земле")
                            InstallationMethod.entries.forEachIndexed { idx, method ->
                                SegmentedButton(
                                    selected = input.installationMethod == method,
                                    onClick = { viewModel.setInstallationMethod(method) },
                                    shape = SegmentedButtonDefaults.itemShape(
                                        index = idx,
                                        count = InstallationMethod.entries.size
                                    )
                                ) {
                                    Text(shortLabels[idx])
                                }
                            }
                        }

                        Text(
                            text = "Количество нагруженных жил (колонка таблиц ПУЭ)",
                            style = MaterialTheme.typography.labelLarge,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                        SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                            LoadedCores.entries.forEachIndexed { idx, core ->
                                SegmentedButton(
                                    selected = input.loadedCores == core,
                                    onClick = { viewModel.setLoadedCores(core) },
                                    shape = SegmentedButtonDefaults.itemShape(
                                        index = idx,
                                        count = LoadedCores.entries.size
                                    )
                                ) {
                                    Text(core.title)
                                }
                            }
                        }
                    }

                    HorizontalDivider()

                    // Фазность, напряжение и cos φ
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = "Сеть и коэффициент мощности cos φ",
                            style = MaterialTheme.typography.labelLarge
                        )
                        SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                            PhaseCount.entries.forEachIndexed { idx, phase ->
                                SegmentedButton(
                                    selected = input.phases == phase,
                                    onClick = { viewModel.setPhases(phase) },
                                    shape = SegmentedButtonDefaults.itemShape(
                                        index = idx,
                                        count = PhaseCount.entries.size
                                    )
                                ) {
                                    Text(phase.title)
                                }
                            }
                        }

                        // Быстрый выбор точного напряжения (220/230 В или 380/400 В)
                        val voltageOptions = if (input.phases == PhaseCount.SINGLE_PHASE) {
                            listOf(220, 230)
                        } else {
                            listOf(380, 400)
                        }
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Напряжение U:",
                                style = MaterialTheme.typography.bodyMedium
                            )
                            voltageOptions.forEach { v ->
                                FilterChip(
                                    selected = input.voltage == v,
                                    onClick = { viewModel.setVoltage(v) },
                                    label = { Text("$v В") }
                                )
                            }
                        }

                        // Ползунок и пресеты cos φ
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "Коэффициент мощности cos φ",
                                style = MaterialTheme.typography.bodyMedium
                            )
                            Text(
                                text = String.format("%.2f", input.cosPhi),
                                fontFamily = FontFamily.Monospace,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Slider(
                            value = input.cosPhi.toFloat(),
                            onValueChange = {
                                val rounded = (it * 100f).roundToInt() / 100.0
                                viewModel.setCosPhi(rounded)
                            },
                            valueRange = 0.60f..1.00f,
                            steps = 39
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            AssistChip(
                                onClick = { viewModel.setCosPhi(1.0) },
                                label = { Text("1.0 (ТЭНы)") }
                            )
                            AssistChip(
                                onClick = { viewModel.setCosPhi(0.95) },
                                label = { Text("0.95 (Быт)") }
                            )
                            AssistChip(
                                onClick = { viewModel.setCosPhi(0.85) },
                                label = { Text("0.85 (Двигатели)") }
                            )
                        }
                    }

                    HorizontalDivider()

                    // Длина линии и допустимое падение напряжения ΔUдоп
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text(
                            text = "Проверка по потере напряжения ΔU (ПУЭ п. 7.1.13)",
                            style = MaterialTheme.typography.labelLarge
                        )
                        OutlinedTextField(
                            value = lengthText,
                            onValueChange = {
                                lengthText = it
                                viewModel.setLengthMeters(it)
                            },
                            label = { Text("Длина кабельной трассы L (м)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )

                        Text(
                            text = "Допустимое падение напряжения ΔUдоп:",
                            style = MaterialTheme.typography.bodyMedium
                        )
                        SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                            val dropChoices = listOf(
                                3.0 to "3% (Освещение)",
                                5.0 to "5% (Силовая нагрузка)"
                            )
                            dropChoices.forEachIndexed { idx, (percent, label) ->
                                SegmentedButton(
                                    selected = input.maxVoltageDropPercent == percent,
                                    onClick = { viewModel.setMaxVoltageDropPercent(percent) },
                                    shape = SegmentedButtonDefaults.itemShape(
                                        index = idx,
                                        count = dropChoices.size
                                    )
                                ) {
                                    Text(label)
                                }
                            }
                        }
                    }

                    HorizontalDivider()

                    // Раскрывающийся блок «Условия прокладки и коэффициенты»
                    Surface(
                        onClick = { conditionsExpanded = !conditionsExpanded },
                        shape = RoundedCornerShape(12.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 12.dp, vertical = 10.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "Условия прокладки и коэффициенты ПУЭ",
                                    style = MaterialTheme.typography.labelLarge,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    text = "T = ${input.ambientTempC}°C (Kt=${result.tempFactor}) · Пучок: ${input.bundleCount.label} каб. (Kb=${result.bundleFactor})",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Icon(
                                imageVector = if (conditionsExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                contentDescription = null
                            )
                        }
                    }

                    AnimatedVisibility(visible = conditionsExpanded) {
                        Column(
                            modifier = Modifier.padding(top = 8.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "Температура среды (Табл. 1.3.3 ПУЭ)",
                                    style = MaterialTheme.typography.bodyMedium
                                )
                                Text(
                                    text = "${input.ambientTempC} °C (Kt = ${result.tempFactor})",
                                    fontFamily = FontFamily.Monospace,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Slider(
                                value = input.ambientTempC.toFloat(),
                                onValueChange = { viewModel.setAmbientTempC(it.roundToInt()) },
                                valueRange = 5f..55f,
                                steps = 9
                            )

                            Text(
                                text = "Количество кабелей в пучке / трубе (Табл. 1.3.26 ПУЭ)",
                                style = MaterialTheme.typography.bodyMedium
                            )
                            FlowRow(
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                BundleCount.entries.forEach { bundle ->
                                    FilterChip(
                                        selected = input.bundleCount == bundle,
                                        onClick = { viewModel.setBundleCount(bundle) },
                                        label = { Text("${bundle.label} (x${bundle.factor})") }
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // 4. КАРТОЧКА «ЭЛЕКТРИЧЕСКИЕ ПАРАМЕТРЫ»
            ElectricalParametersCard(input = input, result = result)

            // 5. КАРТОЧКА «ПОТЕРИ НАПРЯЖЕНИЯ И КЗ»
            VoltageDropAndShortCircuitCard(
                input = input,
                result = result,
                onApplyRecommendedSection = viewModel::applyRecommendedSectionForDrop
            )

            // 6. СИСТЕМНЫЕ ФУНКЦИИ ANDROID: КОПИРОВАТЬ И ПОДЕЛИТЬСЯ СПЕЦИФИКАЦИЕЙ
            OutlinedCard(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = "Спецификация для проекта / щита",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold
                    )
                    Surface(
                        color = MaterialTheme.colorScheme.surfaceVariant,
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text(
                            text = result.specificationString,
                            modifier = Modifier.padding(12.dp),
                            style = MaterialTheme.typography.bodySmall,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        OutlinedButton(
                            onClick = {
                                clipboardManager.setText(AnnotatedString(result.specificationString))
                                coroutineScope.launch {
                                    snackbarHostState.showSnackbar("Спецификация скопирована в буфер обмена")
                                }
                            },
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.ContentCopy, contentDescription = null)
                            Spacer(Modifier.width(8.dp))
                            Text("Копировать")
                        }

                        Button(
                            onClick = {
                                val sendIntent = Intent(Intent.ACTION_SEND).apply {
                                    type = "text/plain"
                                    putExtra(Intent.EXTRA_SUBJECT, "Расчет кабельной линии по ПУЭ")
                                    putExtra(Intent.EXTRA_TEXT, result.specificationString)
                                }
                                val shareIntent = Intent.createChooser(sendIntent, "Поделиться расчетом ПУЭ")
                                context.startActivity(shareIntent)
                            },
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.Share, contentDescription = null)
                            Spacer(Modifier.width(8.dp))
                            Text("Поделиться")
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun HeroBreakerCard(
    input: CalculatorInput,
    result: CalculationResult,
    onCurveSelected: (BreakerCurve) -> Unit,
    onStrictMarginChanged: (Boolean) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer
        )
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Рекомендуемый номинал АВ",
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                    )
                    Text(
                        text = if (result.activeBreakerIn > 0) {
                            "${input.breakerCurve.code}${result.activeBreakerIn} (${result.activeBreakerIn} А)"
                        } else {
                            "Ток < 1 А"
                        },
                        style = MaterialTheme.typography.headlineLarge,
                        fontWeight = FontWeight.ExtraBold,
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }

                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = MaterialTheme.colorScheme.surface.copy(alpha = 0.9f)
                ) {
                    Column(
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                        horizontalAlignment = Alignment.End
                    ) {
                        Text(
                            text = "P макс (по АВ)",
                            style = MaterialTheme.typography.labelSmall
                        )
                        Text(
                            text = "${result.maxPowerBreakerKw} кВт",
                            style = MaterialTheme.typography.titleMedium,
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            // Переключатель время-токовой характеристики B / C / D
            SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                BreakerCurve.entries.forEachIndexed { idx, curve ->
                    SegmentedButton(
                        selected = input.breakerCurve == curve,
                        onClick = { onCurveSelected(curve) },
                        shape = SegmentedButtonDefaults.itemShape(
                            index = idx,
                            count = BreakerCurve.entries.size
                        )
                    ) {
                        Text("Кривая ${curve.code}")
                    }
                }
            }

            Text(
                text = input.breakerCurve.description,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.85f)
            )

            // Линейный прогресс-бар загрузки кабеля (In / Iдд)
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                val loadPercent = (result.cableLoadRatio * 100).roundToInt()
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "Загрузка кабеля по номиналу АВ (In / Iдд)",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                    Text(
                        text = "${result.activeBreakerIn} А из ${result.effectiveAmpacity} А ($loadPercent%)",
                        style = MaterialTheme.typography.labelMedium,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
                LinearProgressIndicator(
                    progress = { result.cableLoadRatio },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(10.dp),
                    color = when {
                        result.cableLoadRatio > 0.92f -> Color(0xFFD97706)
                        else -> MaterialTheme.colorScheme.primary
                    },
                    trackColor = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.15f)
                )
            }

            // Переключатель строгого запаса по перегрузке (1.45 * In <= Iдд)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Строгий запас по тепловому расцепителю (1.45·In ≤ Iдд)",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                    Text(
                        text = "Базовый по ПУЭ: ${result.recommendedBreakerIn} А · С запасом I₂: ${result.strictOverloadBreakerIn} А",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                    )
                }
                Switch(
                    checked = input.strictOverloadMargin,
                    onCheckedChange = onStrictMarginChanged
                )
            }
        }
    }
}

@Composable
private fun ElectricalParametersCard(
    input: CalculatorInput,
    result: CalculationResult
) {
    OutlinedCard(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Text(
                text = "Электрические параметры",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            ParameterRow(
                label = "Допустимый ток кабеля Iдд (с коэф.)",
                value = "${result.effectiveAmpacity} А (база ${result.baseAmpacity} А × ${result.tempFactor} × ${result.bundleFactor})"
            )
            ParameterRow(
                label = "Ток нерасцепления АВ (I₁ = 1.13·In)",
                value = "${result.thermalNonTripI1} А (не откл. > 1 ч)"
            )
            ParameterRow(
                label = "Ток срабатывания теплового расц. (I₂ = 1.45·In)",
                value = "${result.thermalTripI2} А (откл. ≤ 1 ч)"
            )
            ParameterRow(
                label = "Допустимый перегруз кабеля (1.45·Iдд)",
                value = "${result.cableOverloadLimit145} А"
            )
            HorizontalDivider()
            ParameterRow(
                label = "Макс. мощность по выбранному АВ (${result.activeBreakerIn} А)",
                value = "${result.maxPowerBreakerKw} кВт (${input.voltage} В, cos φ = ${input.cosPhi})"
            )
            ParameterRow(
                label = "Предельная мощность по кабелю (${result.effectiveAmpacity} А)",
                value = "${result.maxPowerCableKw} кВт"
            )
        }
    }
}

@Composable
private fun VoltageDropAndShortCircuitCard(
    input: CalculatorInput,
    result: CalculationResult,
    onApplyRecommendedSection: () -> Unit
) {
    OutlinedCard(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Потери напряжения и петля «фаза-ноль»",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = if (result.isVoltageDropOk) "В норме (≤ ${input.maxVoltageDropPercent}%)" else "Превышение ΔU!",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold,
                    color = if (result.isVoltageDropOk) Color(0xFF16A34A) else MaterialTheme.colorScheme.error
                )
            }

            ParameterRow(
                label = "Падение напряжения ΔU (при In = ${result.activeBreakerIn} А)",
                value = "${result.voltageDropVolts} В (${result.voltageDropPercent}%)"
            )

            if (!result.isVoltageDropOk && result.recommendedSectionForDropMm2 != null) {
                Button(
                    onClick = onApplyRecommendedSection,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Применить рекомендуемое сечение ${result.recommendedSectionForDropMm2} мм²")
                }
            }

            HorizontalDivider()

            ParameterRow(
                label = "Мин. ток однофазного КЗ (Iкз min для ${input.breakerCurve.code}${result.activeBreakerIn})",
                value = "${result.minShortCircuitCurrentA} А (${input.breakerCurve.emrMultiplierWithMargin} × In)"
            )
            ParameterRow(
                label = "Макс. сопротивление петли «фаза-ноль» Zпетли",
                value = "${result.maxLoopImpedanceOhm} Ом"
            )
            ParameterRow(
                label = "Ориентировочная макс. длина линии по ТКЗ",
                value = "~${result.estimatedMaxLengthByScMeters} м"
            )
        }
    }
}

@Composable
private fun WarningBannerCard(
    warning: EngineeringWarning,
    recommendedSection: Double?,
    onApplyRecommendedSection: () -> Unit
) {
    val containerColor = when (warning.severity) {
        WarningSeverity.ERROR -> MaterialTheme.colorScheme.errorContainer
        WarningSeverity.WARNING -> Color(0xFFFEF3C7)
        WarningSeverity.INFO -> MaterialTheme.colorScheme.secondaryContainer
    }
    val contentColor = when (warning.severity) {
        WarningSeverity.ERROR -> MaterialTheme.colorScheme.onErrorContainer
        WarningSeverity.WARNING -> Color(0xFF92400E)
        WarningSeverity.INFO -> MaterialTheme.colorScheme.onSecondaryContainer
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = containerColor),
        border = BorderStroke(1.dp, contentColor.copy(alpha = 0.25f))
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Warning,
                    contentDescription = null,
                    tint = contentColor
                )
                Column {
                    Text(
                        text = warning.title,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = contentColor
                    )
                    Text(
                        text = warning.clause,
                        style = MaterialTheme.typography.labelSmall,
                        color = contentColor.copy(alpha = 0.8f)
                    )
                }
            }
            Text(
                text = warning.message,
                style = MaterialTheme.typography.bodySmall,
                color = contentColor
            )
            if (recommendedSection != null) {
                TextButton(onClick = onApplyRecommendedSection) {
                    Text(
                        text = "Переключить на $recommendedSection мм²",
                        fontWeight = FontWeight.Bold,
                        color = contentColor
                    )
                }
            }
        }
    }
}

@Composable
private fun ParameterRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.Top
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.weight(1f)
        )
        Spacer(Modifier.width(12.dp))
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontFamily = FontFamily.Monospace,
            fontWeight = FontWeight.SemiBold
        )
    }
}

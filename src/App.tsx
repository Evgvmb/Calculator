import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  FileCode,
  Info,
  Layers,
  Moon,
  Printer,
  Settings,
  Share2,
  Sun,
  Table,
  Thermometer,
  Zap,
  Calculator,
} from 'lucide-react';
import {
  ALUMINUM_PVC_TABLE,
  BreakerCurve,
  BUNDLE_FACTORS,
  BundleCount,
  ConductorMaterial,
  COPPER_PVC_TABLE,
  InstallationMethod,
  InsulationType,
  LoadedCores,
  PhaseCount,
  STANDARD_SECTIONS,
} from './engine/pueTables';
import {
  calculateCableAndBreaker,
  CalculatorInput,
} from './engine/calculatorEngine';
import { PWA_EXPORT_FILES } from './data/pwaBundleFiles';
import { KOTLIN_SOURCE_FILES } from './data/kotlinSourceFiles';
import { useOnlineStatus, usePWAInstall } from './usePWAInstall';

type SidebarSection = 'calc' | 'ref' | 'about';

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(true);
  const [activeSection, setActiveSection] = useState<SidebarSection>('calc');
  const [conditionsOpen, setConditionsOpen] = useState<boolean>(true);
  const [copiedSpec, setCopiedSpec] = useState<boolean>(false);
  const [copiedFileId, setCopiedFileId] = useState<string | null>(null);
  const [selectedPwaFileId, setSelectedPwaFileId] =
    useState<string>('index-html');
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();

  // Начальное состояние в точности соответствует скриншоту CableCalc Pro:
  // Медь (Cu), ПВХ (+70°C), 2.5 мм², 3 фазы (380/400 В), cos φ = 0.95, Скрыто (в трубе), L = 25 м, ΔU = 5%
  const [input, setInput] = useState<CalculatorInput>({
    material: ConductorMaterial.COPPER,
    insulation: InsulationType.PVC_70,
    sectionMm2: 2.5,
    phases: PhaseCount.THREE_PHASE,
    voltage: 380,
    cosPhi: 0.95,
    installationMethod: InstallationMethod.CONDUIT,
    loadedCores: LoadedCores.TWO,
    lengthMeters: 25,
    maxVoltageDropPercent: 5,
    ambientTempC: 25,
    bundleCount: BundleCount.SINGLE,
    breakerCurve: BreakerCurve.C,
    strictOverloadMargin: false,
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  const result = useMemo(() => calculateCableAndBreaker(input), [input]);

  const updateInput = (patch: Partial<CalculatorInput>) => {
    setInput((prev) => {
      const next = { ...prev, ...patch };
      if (
        next.material === ConductorMaterial.ALUMINUM &&
        next.sectionMm2 < 2.5
      ) {
        next.sectionMm2 = 2.5;
      }
      return next;
    });
  };

  const handleMaterialChange = (material: ConductorMaterial) => {
    updateInput({
      material,
      sectionMm2:
        material === ConductorMaterial.ALUMINUM && input.sectionMm2 < 2.5
          ? 2.5
          : input.sectionMm2,
    });
  };

  const handleCopySpec = async () => {
    try {
      await navigator.clipboard.writeText(result.specificationString);
      setCopiedSpec(true);
      setTimeout(() => setCopiedSpec(false), 2200);
    } catch {
      // ignore
    }
  };

  const handleShareSpec = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'CableCalc Pro — Расчет ПУЭ-7',
          text: result.specificationString,
        });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    await handleCopySpec();
  };

  const handleDownloadFile = (fileName: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyFileContent = async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedFileId(id);
      setTimeout(() => setCopiedFileId(null), 2000);
    } catch {
      // ignore
    }
  };

  const activePwaFile =
    PWA_EXPORT_FILES.find((f) => f.id === selectedPwaFileId) ||
    PWA_EXPORT_FILES[0];

  const loadPercentRound = Math.round(result.cableLoadRatioPercent);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 dark:bg-[#0b1322] dark:text-[#f1f5f9] transition-colors">
      {/* ВЕРХНЯЯ ПАНЕЛЬ (TOP HEADER BAR по референсу CableCalc Pro) */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-4 px-4 sm:px-6 py-3 bg-white dark:bg-[#0d1729] border-b border-slate-200 dark:border-[#1e3150]">
        {/* Левая зона: Логотип CableCalc Pro + Вертикальный разделитель + Подзаголовок ПУЭ */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#1d7bf6]/15 flex items-center justify-center text-[#1d7bf6] shrink-0">
            <Zap className="w-6 h-6 fill-[#1d7bf6]" />
          </div>
          <div className="min-w-0">
            <div className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight truncate">
              CableCalc Pro
            </div>
            <div className="text-xs text-slate-500 dark:text-[#8ea2c0] truncate">
              Инженерный калькулятор
            </div>
          </div>

          <div className="hidden md:block h-8 w-px bg-slate-200 dark:bg-[#1e3150] mx-2 shrink-0" />

          <div className="hidden md:block text-xs text-slate-500 dark:text-[#8ea2c0] leading-snug">
            Расчет кабельных линий
            <br />
            по ПУЭ (7-е издание)
          </div>
        </div>

        {/* Правая зона: Кнопка установки PWA + Индикатор «Работает офлайн» + Переключатель темы + Настройки */}
        <div className="flex items-center gap-2.5 shrink-0">
          {!isInstalled && isInstallable && (
            <button
              type="button"
              onClick={install}
              className="px-3.5 py-2 rounded-full bg-[#1d7bf6] hover:bg-[#2b86ff] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Установить приложение</span>
            </button>
          )}

          {!isInstalled && !isInstallable && isIOS && (
            <button
              type="button"
              onClick={() => setShowIOSGuide(true)}
              className="px-3 py-1.5 rounded-full border border-[#1d7bf6] text-[#1d7bf6] text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              Установить на iOS
            </button>
          )}

          {/* Зеленая капсула «Работает офлайн» */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#18b76c]/15 border border-[#18b76c]/40 text-[#18b76c] text-xs font-semibold whitespace-nowrap">
            <span className="w-4 h-4 rounded-full bg-[#18b76c] text-white flex items-center justify-center">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </span>
            <span>{isOnline ? 'Работает офлайн' : 'Автономный режим'}</span>
          </div>

          {/* Кнопка переключения темы (Светлая / Темная) */}
          <button
            type="button"
            onClick={() => setIsDark(!isDark)}
            title={isDark ? 'Включить светлую тему' : 'Включить темную тему'}
            className="w-9 h-9 rounded-lg border border-slate-200 dark:border-[#213454] bg-slate-50 dark:bg-[#121e33] text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Кнопка быстрого перехода к коду PWA (index.html, manifest.json, sw.js) */}
          <button
            type="button"
            onClick={() => setActiveSection('about')}
            title="Код PWA (index.html, manifest.json, sw.js) и сборка APK"
            className="w-9 h-9 rounded-lg border border-slate-200 dark:border-[#213454] bg-slate-50 dark:bg-[#121e33] text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ОСНОВНОЙ КОНТЕЙНЕР: ЛЕВОЕ МЕНЮ + РАБОЧАЯ ОБЛАСТЬ */}
      <div className="flex-1 flex max-w-[1440px] w-full mx-auto">
        {/* ЛЕВАЯ БОКОВАЯ ПАНЕЛЬ (SIDEBAR по референсу) */}
        <aside className="hidden lg:flex w-56 flex-col justify-between bg-white dark:bg-[#0d1729] border-r border-slate-200 dark:border-[#1e3150] p-3.5 shrink-0 select-none">
          <nav className="space-y-1.5">
            <button
              type="button"
              onClick={() => setActiveSection('calc')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeSection === 'calc'
                  ? 'bg-gradient-to-r from-[#1d7bf6] to-[#1d7bf6]/30 text-white shadow-md shadow-[#1d7bf6]/20'
                  : 'text-slate-600 dark:text-[#94a3b8] hover:bg-slate-100 dark:hover:bg-[#121e33] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calculator className="w-4 h-4 shrink-0" />
              <span>Расчет</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('ref')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeSection === 'ref'
                  ? 'bg-gradient-to-r from-[#1d7bf6] to-[#1d7bf6]/30 text-white shadow-md shadow-[#1d7bf6]/20'
                  : 'text-slate-600 dark:text-[#94a3b8] hover:bg-slate-100 dark:hover:bg-[#121e33] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Table className="w-4 h-4 shrink-0" />
              <span>Справочники</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('about')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeSection === 'about'
                  ? 'bg-gradient-to-r from-[#1d7bf6] to-[#1d7bf6]/30 text-white shadow-md shadow-[#1d7bf6]/20'
                  : 'text-slate-600 dark:text-[#94a3b8] hover:bg-slate-100 dark:hover:bg-[#121e33] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Info className="w-4 h-4 shrink-0" />
              <span>О программе</span>
            </button>
          </nav>

          {/* Силуэт опоры ЛЭП внизу сайдбара (как на референсе) */}
          <div className="pt-6 pb-2 text-center">
            <svg
              viewBox="0 0 160 150"
              className="w-36 h-32 mx-auto text-slate-300 dark:text-[#1e3150]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M80 12 L52 140 M80 12 L108 140" />
              <path d="M40 42 H120 M34 72 H126 M48 102 H112" />
              <path d="M64 42 L96 72 M96 42 L64 72 M58 72 L102 102 M102 72 L58 102 M54 102 L106 138 M106 102 L54 138" />
              <path d="M80 12 L68 42 M80 12 L92 42" />
              <path
                d="M120 42 Q140 58 158 52 M40 42 Q20 58 2 52"
                strokeOpacity="0.5"
              />
            </svg>
            <div className="text-[11px] text-slate-400 dark:text-[#64748b] mt-1 tracking-tight">
              ПУЭ • Надежность • Безопасность
            </div>
          </div>
        </aside>

        {/* ОСНОВНАЯ РАБОЧАЯ ЗОНА */}
        <main className="flex-1 p-4 sm:p-5 pb-24 lg:pb-6 space-y-4 min-w-0">
          {activeSection === 'calc' && (
            <>
              {/* ВЕРХНИЙ РЯД: ПАРАМЕТРЫ РАСЧЕТА (СЛЕВА) + РЕКОМЕНДУЕМЫЙ АВТОМАТ (СПРАВА) */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
                {/* ЛЕВАЯ КАРТОЧКА (7 колонок): ПАРАМЕТРЫ РАСЧЕТА */}
                <section className="xl:col-span-7 rounded-2xl bg-white dark:bg-[#121e33] border border-slate-200 dark:border-[#213454] p-5 flex flex-col justify-between shadow-lg">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#192944] pb-3">
                      <div className="flex items-center gap-2.5">
                        <Settings className="w-5 h-5 text-[#1d7bf6]" />
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">
                          Параметры расчета
                        </h2>
                      </div>
                      <span className="text-[11px] text-slate-400 dark:text-[#64748b] font-mono">
                        Табл. 1.3.4–1.3.7 ПУЭ
                      </span>
                    </div>

                    {/* Строка 1: Материал жилы и Тип изоляции */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-[#94a3b8] mb-1.5">
                          Материал жилы
                        </label>
                        <div className="grid grid-cols-2 rounded-xl bg-slate-100 dark:bg-[#0e182a] border border-slate-200 dark:border-[#213454] overflow-hidden">
                          <button
                            type="button"
                            onClick={() =>
                              handleMaterialChange(ConductorMaterial.COPPER)
                            }
                            className={`min-h-[42px] px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                              input.material === ConductorMaterial.COPPER
                                ? 'bg-[#1d7bf6] text-white'
                                : 'text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            Медь (Cu)
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleMaterialChange(ConductorMaterial.ALUMINUM)
                            }
                            className={`min-h-[42px] px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                              input.material === ConductorMaterial.ALUMINUM
                                ? 'bg-[#1d7bf6] text-white'
                                : 'text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            Алюминий (Al)
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-[#94a3b8] mb-1.5">
                          Тип изоляции
                        </label>
                        <div className="grid grid-cols-2 rounded-xl bg-slate-100 dark:bg-[#0e182a] border border-slate-200 dark:border-[#213454] overflow-hidden">
                          <button
                            type="button"
                            onClick={() =>
                              updateInput({ insulation: InsulationType.PVC_70 })
                            }
                            className={`min-h-[42px] px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                              input.insulation === InsulationType.PVC_70
                                ? 'bg-[#1d7bf6] text-white'
                                : 'text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            ПВХ (до +70°C)
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateInput({
                                insulation: InsulationType.XLPE_90,
                              })
                            }
                            className={`min-h-[42px] px-2.5 py-1.5 text-[11px] leading-tight font-semibold transition-colors cursor-pointer ${
                              input.insulation === InsulationType.XLPE_90
                                ? 'bg-[#1d7bf6] text-white'
                                : 'text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            СПЭ / Резина
                            <br />
                            (до +90°C)
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Строка 2: Сечение, мм² | Напряжение сети | cos φ */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                      <div className="sm:col-span-4">
                        <label
                          htmlFor="section-select"
                          className="block text-xs font-medium text-slate-600 dark:text-[#94a3b8] mb-1.5"
                        >
                          Сечение, мм²
                        </label>
                        <select
                          id="section-select"
                          value={input.sectionMm2}
                          onChange={(e) =>
                            updateInput({
                              sectionMm2: parseFloat(e.target.value),
                            })
                          }
                          className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#14223a] border border-slate-200 dark:border-[#213454] text-sm font-semibold font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#1d7bf6]"
                        >
                          {STANDARD_SECTIONS.map((sec) => {
                            const blocked =
                              input.material === ConductorMaterial.ALUMINUM &&
                              sec < 2.5;
                            return (
                              <option
                                key={sec}
                                value={sec}
                                disabled={blocked}
                              >
                                {sec} {blocked ? '(не для Al по ПУЭ)' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="sm:col-span-5">
                        <label
                          htmlFor="phase-select"
                          className="block text-xs font-medium text-slate-600 dark:text-[#94a3b8] mb-1.5"
                        >
                          Напряжение сети
                        </label>
                        <select
                          id="phase-select"
                          value={
                            input.phases === PhaseCount.THREE_PHASE
                              ? '3_380'
                              : '1_220'
                          }
                          onChange={(e) => {
                            if (e.target.value === '3_380') {
                              updateInput({
                                phases: PhaseCount.THREE_PHASE,
                                voltage: 380,
                              });
                            } else {
                              updateInput({
                                phases: PhaseCount.SINGLE_PHASE,
                                voltage: 220,
                              });
                            }
                          }}
                          className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#14223a] border border-slate-200 dark:border-[#213454] text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#1d7bf6]"
                        >
                          <option value="3_380">3 фазы (380/400 В)</option>
                          <option value="1_220">1 фаза (220/230 В)</option>
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <label
                          htmlFor="cosphi-select"
                          className="block text-xs font-medium text-slate-600 dark:text-[#94a3b8] mb-1.5"
                        >
                          cos φ
                        </label>
                        <select
                          id="cosphi-select"
                          value={input.cosPhi}
                          onChange={(e) =>
                            updateInput({ cosPhi: parseFloat(e.target.value) })
                          }
                          className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#14223a] border border-slate-200 dark:border-[#213454] text-sm font-semibold font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#1d7bf6]"
                        >
                          <option value={1.0}>1.00 (ТЭН)</option>
                          <option value={0.95}>0.95</option>
                          <option value={0.9}>0.90</option>
                          <option value={0.85}>0.85 (Двиг.)</option>
                          <option value={0.8}>0.80</option>
                        </select>
                      </div>
                    </div>

                    {/* Строка 3: Способ прокладки | Количество жил */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="method-select"
                          className="block text-xs font-medium text-slate-600 dark:text-[#94a3b8] mb-1.5"
                        >
                          Способ прокладки
                        </label>
                        <select
                          id="method-select"
                          value={input.installationMethod}
                          onChange={(e) => {
                            const nextMethod = e.target
                              .value as InstallationMethod;
                            const nextTemp =
                              nextMethod === InstallationMethod.GROUND
                                ? 15
                                : 25;
                            updateInput({
                              installationMethod: nextMethod,
                              ambientTempC: nextTemp,
                            });
                          }}
                          className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#14223a] border border-slate-200 dark:border-[#213454] text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#1d7bf6]"
                        >
                          <option value={InstallationMethod.CONDUIT}>
                            Скрыто (в трубе / штробе)
                          </option>
                          <option value={InstallationMethod.OPEN_AIR}>
                            Открыто (по воздуху / в лотке)
                          </option>
                          <option value={InstallationMethod.GROUND}>
                            В земле (траншее)
                          </option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="cores-select"
                          className="block text-xs font-medium text-slate-600 dark:text-[#94a3b8] mb-1.5"
                        >
                          Количество жил
                        </label>
                        <select
                          id="cores-select"
                          value={input.loadedCores}
                          onChange={(e) =>
                            updateInput({
                              loadedCores: parseInt(
                                e.target.value,
                                10
                              ) as LoadedCores,
                            })
                          }
                          className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#14223a] border border-slate-200 dark:border-[#213454] text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#1d7bf6]"
                        >
                          <option value={LoadedCores.TWO}>
                            Трехжильный (1ф: L+N+PE) / Двухжильный
                          </option>
                          <option value={LoadedCores.THREE}>
                            Трехфазный (3 нагруженные жилы)
                          </option>
                          <option value={LoadedCores.ONE}>
                            Одножильный кабель
                          </option>
                        </select>
                      </div>
                    </div>

                    {/* Строка 4: Длина линии, м | ΔU допустимое */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="length-input"
                          className="block text-xs font-medium text-slate-600 dark:text-[#94a3b8] mb-1.5"
                        >
                          Длина линии, м
                        </label>
                        <input
                          id="length-input"
                          type="number"
                          min={1}
                          max={5000}
                          value={input.lengthMeters}
                          onChange={(e) =>
                            updateInput({
                              lengthMeters: Math.max(
                                0,
                                parseFloat(e.target.value) || 0
                              ),
                            })
                          }
                          className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#14223a] border border-slate-200 dark:border-[#213454] text-sm font-semibold font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#1d7bf6]"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="drop-select"
                          className="block text-xs font-medium text-slate-600 dark:text-[#94a3b8] mb-1.5"
                        >
                          ΔU допустимое
                        </label>
                        <select
                          id="drop-select"
                          value={input.maxVoltageDropPercent}
                          onChange={(e) =>
                            updateInput({
                              maxVoltageDropPercent: parseFloat(e.target.value),
                            })
                          }
                          className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#14223a] border border-slate-200 dark:border-[#213454] text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#1d7bf6]"
                        >
                          <option value={5}>5% (силовая нагрузка)</option>
                          <option value={3}>3% (освещение)</option>
                        </select>
                      </div>
                    </div>

                    {/* Строка 5: Раскрывающийся блок «Условия прокладки и коэффициенты» */}
                    <div className="rounded-xl bg-slate-50 dark:bg-[#0e182a] border border-slate-200 dark:border-[#192944] p-3.5">
                      <button
                        type="button"
                        onClick={() => setConditionsOpen(!conditionsOpen)}
                        className="w-full flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          {conditionsOpen ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                          <span>Условия прокладки и коэффициенты</span>
                        </span>
                        <span className="font-mono text-[11px] text-slate-500 dark:text-[#8ea2c0]">
                          Kt={result.tempFactor} · Kb={result.bundleFactor}
                        </span>
                      </button>

                      {conditionsOpen && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3 pt-3 border-t border-slate-200/70 dark:border-[#192944]">
                          <div className="flex items-center gap-2.5">
                            <Thermometer className="w-5 h-5 text-slate-400 shrink-0 mt-4" />
                            <div className="flex-1">
                              <label
                                htmlFor="temp-select"
                                className="block text-[11px] text-slate-500 dark:text-[#8ea2c0] mb-1"
                              >
                                Температура среды
                              </label>
                              <select
                                id="temp-select"
                                value={input.ambientTempC}
                                onChange={(e) =>
                                  updateInput({
                                    ambientTempC: parseInt(e.target.value, 10),
                                  })
                                }
                                className="w-full min-h-[38px] px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#14223a] border border-slate-200 dark:border-[#213454] text-xs font-semibold text-slate-900 dark:text-white"
                              >
                                <option value={10}>+10 °C</option>
                                <option value={15}>+15 °C (земля)</option>
                                <option value={20}>+20 °C</option>
                                <option value={25}>+25 °C (воздух)</option>
                                <option value={30}>+30 °C</option>
                                <option value={35}>+35 °C</option>
                                <option value={40}>+40 °C</option>
                                <option value={45}>+45 °C</option>
                                <option value={50}>+50 °C</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <Layers className="w-5 h-5 text-slate-400 shrink-0 mt-4" />
                            <div className="flex-1">
                              <label
                                htmlFor="bundle-select"
                                className="block text-[11px] text-slate-500 dark:text-[#8ea2c0] mb-1"
                              >
                                Кабелей в пучке
                              </label>
                              <select
                                id="bundle-select"
                                value={input.bundleCount}
                                onChange={(e) =>
                                  updateInput({
                                    bundleCount: e.target.value as BundleCount,
                                  })
                                }
                                className="w-full min-h-[38px] px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#14223a] border border-slate-200 dark:border-[#213454] text-xs font-semibold text-slate-900 dark:text-white"
                              >
                                <option value={BundleCount.SINGLE}>
                                  1 кабель (K = 1.00)
                                </option>
                                <option value={BundleCount.TWO}>
                                  2 кабеля (K = 0.85)
                                </option>
                                <option value={BundleCount.THREE}>
                                  3 кабеля (K = 0.79)
                                </option>
                                <option value={BundleCount.FOUR}>
                                  4 кабеля (K = 0.75)
                                </option>
                                <option value={BundleCount.FIVE_SIX}>
                                  5–6 кабелей (K = 0.70)
                                </option>
                                <option value={BundleCount.SEVEN_NINE}>
                                  7–9 кабелей (K = 0.65)
                                </option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* ПРАВАЯ КАРТОЧКА (5 колонок): РЕКОМЕНДУЕМЫЙ АВТОМАТ (HERO CARD по референсу) */}
                <section className="xl:col-span-5 rounded-2xl bg-white dark:bg-[#121e33] border border-slate-200 dark:border-[#213454] p-5 flex flex-col justify-between gap-4 shadow-lg">
                  {/* Зеленый главный блок «Рекомендуемый автомат» */}
                  <div className="rounded-2xl border-2 border-[#18b76c] bg-gradient-to-br from-emerald-50 to-emerald-100/60 dark:from-[#103c32] dark:to-[#0c2728] p-4 sm:p-5 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#18b76c] text-white flex items-center justify-center shrink-0 shadow-lg shadow-[#18b76c]/30">
                      <Check className="w-8 h-8 stroke-[3]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Рекомендуемый автомат
                      </div>
                      <div className="flex flex-wrap items-baseline gap-2.5 mt-0.5">
                        <span className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
                          {result.activeBreakerIn > 0
                            ? `${input.breakerCurve}${result.activeBreakerIn}`
                            : '—'}
                        </span>
                        <span className="text-xs text-slate-600 dark:text-[#94a3b8]">
                          (характеристика {input.breakerCurve})
                        </span>
                      </div>
                      {/* Быстрый выбор кривой B / C / D */}
                      <div className="flex items-center gap-1.5 mt-2.5">
                        {(
                          [
                            BreakerCurve.B,
                            BreakerCurve.C,
                            BreakerCurve.D,
                          ] as const
                        ).map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => updateInput({ breakerCurve: c })}
                            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                              input.breakerCurve === c
                                ? 'bg-[#18b76c] text-white'
                                : 'bg-white/70 dark:bg-[#0e182a]/80 text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            Кривая {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Шкала загрузки кабеля */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3.5 rounded-full bg-slate-100 dark:bg-[#0e182a] border border-slate-200 dark:border-[#192944] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#18b76c] to-[#34d399] transition-all duration-200"
                          style={{
                            width: `${Math.min(100, loadPercentRound)}%`,
                          }}
                        />
                      </div>
                      <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white tabular-nums w-12 text-right">
                        {loadPercentRound}%
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-[#94a3b8]">
                      Загрузка кабеля: {loadPercentRound}%
                    </div>
                  </div>

                  {/* Блок «Ток кабеля | Допустимый ток» */}
                  <div className="grid grid-cols-2 rounded-xl bg-slate-50 dark:bg-[#0e182a] border border-slate-200 dark:border-[#192944] p-3.5 text-center">
                    <div className="border-r border-slate-200 dark:border-[#192944] pr-2">
                      <div className="text-xs text-slate-500 dark:text-[#94a3b8]">
                        Ток кабеля (табл.)
                      </div>
                      <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-0.5 tabular-nums">
                        {result.baseAmpacity} А
                      </div>
                    </div>
                    <div className="pl-2">
                      <div className="text-xs text-slate-500 dark:text-[#94a3b8]">
                        Допустимый ток
                      </div>
                      <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-0.5 tabular-nums">
                        {result.effectiveAmpacity} А
                      </div>
                    </div>
                  </div>

                  {/* Блок «Макс. мощность» */}
                  <div className="rounded-xl bg-slate-50 dark:bg-[#0e182a] border border-slate-200 dark:border-[#192944] px-4 py-3 flex items-center gap-3">
                    <Zap className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0" />
                    <div>
                      <div className="text-xs text-slate-500 dark:text-[#94a3b8]">
                        Макс. мощность
                      </div>
                      <div className="text-xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
                        ≈ {result.maxPowerByCableKw} кВт
                      </div>
                    </div>
                  </div>

                  {/* Статусная плашка внизу правой карточки */}
                  <div
                    className={`rounded-xl px-4 py-2.5 border flex items-center gap-2.5 text-xs font-semibold ${
                      result.isVoltageDropOk && input.sectionMm2 >= 1.5
                        ? 'bg-[#18b76c]/12 border-[#18b76c]/50 text-[#18b76c]'
                        : 'bg-amber-500/12 border-amber-500/50 text-amber-500'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-[#18b76c] text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                    <span>
                      {result.isVoltageDropOk
                        ? 'Расчет выполнен в соответствии с ПУЭ'
                        : `Внимание: потери ΔU = ${result.voltageDropPercent}% (рек. ${result.recommendedSectionForDropMm2} мм²)`}
                    </span>
                  </div>
                </section>
              </div>

              {/* НИЖНИЙ РЯД: 3 ИНЖЕНЕРНЫЕ КАРТОЧКИ (Электрические параметры | Потери напряжения и КЗ | Важные замечания) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Карточка 1: Электрические параметры */}
                <section className="rounded-2xl bg-white dark:bg-[#121e33] border border-slate-200 dark:border-[#213454] p-5 shadow-lg">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-[#192944] pb-3 mb-3.5">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Электрические параметры
                    </h3>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 dark:text-[#94a3b8]">
                        Длительно допустимый ток (Iдд)
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                        {result.effectiveAmpacity} А
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 dark:text-[#94a3b8]">
                        Ток теплового расцепления АВ
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                        {result.thermalNonTripCurrentI1}–{result.thermalTripCurrentI2} А
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 dark:text-[#94a3b8]">
                        Макс. мощность (по АВ)
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                        {result.maxPowerByBreakerKw} кВт
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 dark:text-[#94a3b8]">
                        Макс. мощность (по кабелю)
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                        {result.maxPowerByCableKw} кВт
                      </span>
                    </div>
                  </div>
                </section>

                {/* Карточка 2: Потери напряжения и КЗ */}
                <section className="rounded-2xl bg-white dark:bg-[#121e33] border border-slate-200 dark:border-[#213454] p-5 shadow-lg">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-[#192944] pb-3 mb-3.5">
                    <Activity className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Потери напряжения и КЗ
                    </h3>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 dark:text-[#94a3b8]">
                        Падение напряжения
                      </span>
                      <span className="flex items-center gap-1.5 font-mono">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold tabular-nums ${
                            result.isVoltageDropOk
                              ? 'bg-[#18b76c]/20 text-[#18b76c] border border-[#18b76c]/40'
                              : 'bg-red-500/20 text-red-400 border border-red-500/40'
                          }`}
                        >
                          {result.voltageDropPercent}%
                        </span>
                        <span
                          className={
                            result.isVoltageDropOk
                              ? 'text-[#18b76c]'
                              : 'text-red-400'
                          }
                        >
                          {result.isVoltageDropOk
                            ? '(в норме)'
                            : `(рек. ${result.recommendedSectionForDropMm2} мм²)`}
                        </span>
                      </span>
                    </div>

                    {!result.isVoltageDropOk &&
                      result.recommendedSectionForDropMm2 && (
                        <button
                          type="button"
                          onClick={() =>
                            updateInput({
                              sectionMm2: result.recommendedSectionForDropMm2!,
                            })
                          }
                          className="w-full py-1.5 px-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Установить рекомендуемое сечение{' '}
                          {result.recommendedSectionForDropMm2} мм²
                        </button>
                      )}

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 dark:text-[#94a3b8]">
                        Мин. ток КЗ
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                        {result.minShortCircuitCurrentA} А
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 dark:text-[#94a3b8]">
                        Макс. сопротивление петли «фаза-ноль»
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                        {result.maxLoopImpedanceOhm.toFixed(2)} Ом
                      </span>
                    </div>
                  </div>
                </section>

                {/* Карточка 3: Важные замечания */}
                <section className="rounded-2xl bg-white dark:bg-[#121e33] border border-slate-200 dark:border-[#213454] p-5 shadow-lg">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-[#192944] pb-3 mb-3.5">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Важные замечания
                    </h3>
                  </div>
                  <ul className="space-y-2.5 text-xs text-slate-600 dark:text-[#94a3b8]">
                    <li className="flex items-start gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span>
                        {input.material === ConductorMaterial.ALUMINUM &&
                        input.sectionMm2 < 16
                          ? 'Внимание: Алюминий < 16 мм² в жилых и общественных зданиях запрещен (ПУЭ п. 7.1.34).'
                          : 'Алюминий < 16 мм² в жилых зданиях не рекомендуется (ПУЭ 7.1.34).'}
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span>
                        При групповой прокладке учитывайте коэффициенты (табл.
                        1.3.26).
                      </span>
                    </li>
                    {input.sectionMm2 < 1.5 && (
                      <li className="flex items-start gap-2.5 text-red-400">
                        <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                        <span>
                          Сечения 0.5–1.0 мм² не применяются для стационарной
                          электропроводки (мин. 1.5 мм²).
                        </span>
                      </li>
                    )}
                  </ul>
                </section>
              </div>

              {/* НИЖНЯЯ ПАНЕЛЬ ДЕЙСТВИЙ (FOOTER BAR по референсу) */}
              <footer className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleCopySpec}
                    className="min-h-[42px] px-5 py-2.5 rounded-xl bg-[#1d7bf6] hover:bg-[#2b86ff] text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-[#1d7bf6]/25 transition-colors cursor-pointer"
                  >
                    {copiedSpec ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span>
                      {copiedSpec ? 'Расчет скопирован!' : 'Копировать расчет'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareSpec}
                    className="min-h-[42px] px-4 py-2.5 rounded-xl bg-white dark:bg-[#121e33] border border-slate-200 dark:border-[#213454] hover:border-[#1d7bf6] text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Поделиться</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="min-h-[42px] px-4 py-2.5 rounded-xl bg-white dark:bg-[#121e33] border border-slate-200 dark:border-[#213454] hover:border-[#1d7bf6] text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Печать</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSection('about')}
                    className="min-h-[42px] px-4 py-2.5 rounded-xl bg-white dark:bg-[#121e33] border border-slate-200 dark:border-[#213454] hover:border-[#1d7bf6] text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <FileCode className="w-4 h-4 text-[#1d7bf6]" />
                    <span>Файлы PWA (index.html, manifest.json, sw.js)</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-[#8ea2c0]">
                  <Info className="w-3.5 h-3.5" />
                  <span>CableCalc Pro v1.0 • ПУЭ 7-е издание</span>
                </div>
              </footer>
            </>
          )}

          {/* РАЗДЕЛ 2: СПРАВОЧНИКИ ПУЭ */}
          {activeSection === 'ref' && (
            <section className="rounded-2xl bg-white dark:bg-[#121e33] border border-slate-200 dark:border-[#213454] p-5 space-y-4 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-[#192944] pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Таблицы длительно допустимых токов ПУЭ (7-е изд., табл.
                    1.3.4–1.3.7)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
                    Нажмите на любую строку сечения, чтобы подставить его в
                    калькулятор
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      handleMaterialChange(ConductorMaterial.COPPER)
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      input.material === ConductorMaterial.COPPER
                        ? 'bg-[#1d7bf6] text-white'
                        : 'bg-slate-100 dark:bg-[#0e182a] text-slate-600 dark:text-[#94a3b8]'
                    }`}
                  >
                    Медь (Cu)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleMaterialChange(ConductorMaterial.ALUMINUM)
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      input.material === ConductorMaterial.ALUMINUM
                        ? 'bg-[#1d7bf6] text-white'
                        : 'bg-slate-100 dark:bg-[#0e182a] text-slate-600 dark:text-[#94a3b8]'
                    }`}
                  >
                    Алюминий (Al)
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-[#213454] text-slate-500 dark:text-[#94a3b8]">
                      <th className="py-2.5 px-3">Сечение</th>
                      <th className="py-2.5 px-3 text-right">Открыто 1х</th>
                      <th className="py-2.5 px-3 text-right">Открыто 2х</th>
                      <th className="py-2.5 px-3 text-right">Открыто 3х</th>
                      <th className="py-2.5 px-3 text-right">В трубе 1х</th>
                      <th className="py-2.5 px-3 text-right">В трубе 2х</th>
                      <th className="py-2.5 px-3 text-right">В трубе 3х</th>
                      <th className="py-2.5 px-3 text-right">В земле 1х</th>
                      <th className="py-2.5 px-3 text-right">В земле 2х</th>
                      <th className="py-2.5 px-3 text-right">В земле 3х</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#192944]">
                    {Object.entries(
                      input.material === ConductorMaterial.COPPER
                        ? COPPER_PVC_TABLE
                        : ALUMINUM_PVC_TABLE
                    ).map(([secStr, row]) => {
                      const sec = parseFloat(secStr);
                      const active = sec === input.sectionMm2;
                      return (
                        <tr
                          key={sec}
                          onClick={() => {
                            updateInput({ sectionMm2: sec });
                            setActiveSection('calc');
                          }}
                          className={`cursor-pointer transition-colors ${
                            active
                              ? 'bg-[#1d7bf6]/20 font-bold text-[#1d7bf6]'
                              : 'hover:bg-slate-50 dark:hover:bg-[#14223a]'
                          }`}
                        >
                          <td className="py-2 px-3 font-bold">{sec} мм²</td>
                          <td className="py-2 px-3 text-right">{row.open1} А</td>
                          <td className="py-2 px-3 text-right">{row.open2} А</td>
                          <td className="py-2 px-3 text-right">{row.open3} А</td>
                          <td className="py-2 px-3 text-right">
                            {row.conduit1} А
                          </td>
                          <td className="py-2 px-3 text-right">
                            {row.conduit2} А
                          </td>
                          <td className="py-2 px-3 text-right">
                            {row.conduit3} А
                          </td>
                          <td className="py-2 px-3 text-right">
                            {row.ground1} А
                          </td>
                          <td className="py-2 px-3 text-right">
                            {row.ground2} А
                          </td>
                          <td className="py-2 px-3 text-right">
                            {row.ground3} А
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* РАЗДЕЛ 3: О ПРОГРАММЕ + АВТОНОМНЫЕ ФАЙЛЫ PWA (index.html, manifest.json, sw.js) */}
          {activeSection === 'about' && (
            <section className="rounded-2xl bg-white dark:bg-[#121e33] border border-slate-200 dark:border-[#213454] p-5 space-y-5 shadow-lg">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Автономный пакет PWA для GitHub Pages и сборки в APK через
                  PWABuilder
                </h2>
                <p className="text-xs text-slate-500 dark:text-[#94a3b8] mt-1">
                  Ниже представлены готовые автономные файлы{' '}
                  <code className="font-mono text-[#1d7bf6]">index.html</code>{' '}
                  (все стили, таблицы ПУЭ и логика внутри одного файла без
                  внешних зависимостей),{' '}
                  <code className="font-mono text-[#1d7bf6]">manifest.json</code>{' '}
                  и <code className="font-mono text-[#1d7bf6]">sw.js</code>.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {PWA_EXPORT_FILES.map((file) => (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => setSelectedPwaFileId(file.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer ${
                      selectedPwaFileId === file.id
                        ? 'bg-[#1d7bf6] text-white'
                        : 'bg-slate-100 dark:bg-[#0e182a] text-slate-700 dark:text-[#94a3b8] border border-slate-200 dark:border-[#213454]'
                    }`}
                  >
                    {file.fileName}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#0e182a] border border-slate-200 dark:border-[#192944]">
                <div className="text-xs text-slate-600 dark:text-[#94a3b8]">
                  {activePwaFile.description}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyFileContent(
                        activePwaFile.id,
                        activePwaFile.content
                      )
                    }
                    className="px-3.5 py-2 rounded-lg bg-[#1d7bf6] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedFileId === activePwaFile.id ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Скопировано!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Копировать {activePwaFile.fileName}</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadFile(
                        activePwaFile.fileName,
                        activePwaFile.content
                      )
                    }
                    className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-[#213454] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Скачать {activePwaFile.fileName}</span>
                  </button>
                </div>
              </div>

              <pre className="p-4 rounded-xl bg-[#080e1a] text-slate-200 text-xs font-mono leading-relaxed overflow-x-auto border border-[#1e3150] max-h-[520px]">
                <code>{activePwaFile.content}</code>
              </pre>

              {/* Сохраненный доступ к нативным файлам Kotlin из первого запроса */}
              <div className="pt-4 border-t border-slate-200 dark:border-[#192944]">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Нативные файлы Android Studio (Kotlin / Jetpack Compose):
                </div>
                <div className="flex flex-wrap gap-2">
                  {KOTLIN_SOURCE_FILES.map((kt) => (
                    <button
                      key={kt.id}
                      type="button"
                      onClick={() => handleDownloadFile(kt.fileName, kt.code)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#0e182a] border border-slate-200 dark:border-[#213454] text-xs font-mono hover:border-[#1d7bf6] flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3 h-3 text-[#1d7bf6]" />
                      <span>{kt.fileName}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* МОБИЛЬНАЯ НИЖНЯЯ НАВИГАЦИЯ (THUMB-ZONE) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 grid grid-cols-3 bg-white/95 dark:bg-[#0d1729]/95 backdrop-blur-md border-t border-slate-200 dark:border-[#1e3150] h-16">
        <button
          type="button"
          onClick={() => setActiveSection('calc')}
          className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
            activeSection === 'calc'
              ? 'text-[#1d7bf6]'
              : 'text-slate-500 dark:text-[#94a3b8]'
          }`}
        >
          <Calculator className="w-5 h-5" />
          <span>Расчет</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('ref')}
          className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
            activeSection === 'ref'
              ? 'text-[#1d7bf6]'
              : 'text-slate-500 dark:text-[#94a3b8]'
          }`}
        >
          <Table className="w-5 h-5" />
          <span>Справочники</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('about')}
          className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
            activeSection === 'about'
              ? 'text-[#1d7bf6]'
              : 'text-slate-500 dark:text-[#94a3b8]'
          }`}
        >
          <Info className="w-5 h-5" />
          <span>PWA / APK</span>
        </button>
      </nav>

      {/* Модальное окно инструкции установки для iOS Safari */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#121e33] border border-slate-200 dark:border-[#213454] p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Установка CableCalc Pro на iPhone / iPad
            </h3>
            <p className="text-xs text-slate-600 dark:text-[#94a3b8] leading-relaxed">
              1. Нажмите кнопку <strong>«Поделиться»</strong> в панели Safari.
              <br />
              2. Выберите пункт <strong>«На экран „Домой“»</strong> (Add to Home
              Screen).
            </p>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-[#1d7bf6] text-white text-xs font-semibold cursor-pointer"
            >
              Понятно
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import pueTablesKt from '../../android/app/src/main/java/ru/electro/puecalc/PueTables.kt?raw';
import calculatorEngineKt from '../../android/app/src/main/java/ru/electro/puecalc/CalculatorEngine.kt?raw';
import calculatorViewModelKt from '../../android/app/src/main/java/ru/electro/puecalc/CalculatorViewModel.kt?raw';
import mainScreenKt from '../../android/app/src/main/java/ru/electro/puecalc/MainScreen.kt?raw';
import mainActivityKt from '../../android/app/src/main/java/ru/electro/puecalc/MainActivity.kt?raw';

export interface KotlinSourceFile {
  id: string;
  fileName: string;
  packagePath: string;
  role: string;
  code: string;
}

export const BUILD_GRADLE_KTS = `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "ru.electro.puecalc"
    compileSdk = 35

    defaultConfig {
        applicationId = "ru.electro.puecalc"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }

    buildFeatures {
        compose = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.10.01")
    implementation(composeBom)

    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.activity:activity-compose:1.9.3")

    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
}`;

export const KOTLIN_SOURCE_FILES: KotlinSourceFile[] = [
  {
    id: 'PueTables',
    fileName: 'PueTables.kt',
    packagePath: 'app/src/main/java/ru/electro/puecalc/PueTables.kt',
    role: 'Таблицы ПУЭ-7 (1.3.4–1.3.7, 1.3.3, 1.3.26), ряды сечений и номиналов АВ, удельное сопротивление',
    code: pueTablesKt,
  },
  {
    id: 'CalculatorEngine',
    fileName: 'CalculatorEngine.kt',
    packagePath: 'app/src/main/java/ru/electro/puecalc/CalculatorEngine.kt',
    role: 'Расчетное ядро: Iдд, подбор АВ (In ≤ Iдд и 1.45·In ≤ 1.45·Iдд), мощность P, потери ΔU, петля фаза-ноль и предупреждения',
    code: calculatorEngineKt,
  },
  {
    id: 'CalculatorViewModel',
    fileName: 'CalculatorViewModel.kt',
    packagePath: 'app/src/main/java/ru/electro/puecalc/CalculatorViewModel.kt',
    role: 'MVVM ViewModel на базе StateFlow с мгновенным реактивным пересчетом и защитой от Al < 2.5 мм²',
    code: calculatorViewModelKt,
  },
  {
    id: 'MainScreen',
    fileName: 'MainScreen.kt',
    packagePath: 'app/src/main/java/ru/electro/puecalc/MainScreen.kt',
    role: 'Инженерный экран Jetpack Compose (Material 3): SegmentedButton, FilterChip, Hero Card, ΔU, КЗ, Copy & Share Intent',
    code: mainScreenKt,
  },
  {
    id: 'MainActivity',
    fileName: 'MainActivity.kt',
    packagePath: 'app/src/main/java/ru/electro/puecalc/MainActivity.kt',
    role: 'Точка входа Android-приложения с переключателем светлой и темной темы Material 3',
    code: mainActivityKt,
  },
  {
    id: 'buildGradle',
    fileName: 'build.gradle.kts (Module: app)',
    packagePath: 'app/build.gradle.kts',
    role: 'Конфигурация сборки Gradle с Jetpack Compose BOM, ViewModel и Material Icons Extended',
    code: BUILD_GRADLE_KTS,
  },
];

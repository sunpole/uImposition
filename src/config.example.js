/**
 * uImposition configuration example.
 * Русский язык основной; English labels are provided in the same dictionary.
 * This file is documentation-grade scaffolding, not the finished application config.
 */
export const CONFIG = Object.freeze({
  app: {
    name: "uImposition",
    version: "0.0.1-docs",
    defaultLanguage: "ru",
    supportedLanguages: ["ru", "en"],
    unit: "mm"
  },

  sheetPresets: [
    { id: "616x446", width: 616, height: 446, sizeStage: "afterTrim" },
    { id: "616x466", width: 616, height: 466, sizeStage: "afterTrim" },
    { id: "636x448", width: 636, height: 448, sizeStage: "afterTrim" },
    { id: "646x466", width: 646, height: 466, sizeStage: "afterTrim" },
    { id: "650x313", width: 650, height: 313, sizeStage: "afterTrim" },
    { id: "716x326", width: 716, height: 326, sizeStage: "afterTrim" },
    { id: "716x336", width: 716, height: 336, sizeStage: "afterTrim" },
    { id: "716x516", width: 716, height: 516, sizeStage: "afterTrim" }
  ],

  defaultSheetPresetId: "616x446",

  sheetTrim: {
    enabledByDefault: true,
    inputSizeStageDefault: "beforeTrim",
    uniformByDefault: true,
    uniformMmDefault: 2,
    sidesMmDefault: { left: 2, right: 2, top: 2, bottom: 2 },
    minMm: 0,
    stepMm: 0.1
  },

  pressMargins: {
    defaultMm: { left: 4, right: 4, top: 2, bottom: 13 },
    minMm: 0,
    stepMm: 0.1
  },

  productPresets: [
    { id: "A4", width: 210, height: 297 },
    { id: "A5", width: 148, height: 210 },
    { id: "A6", width: 105, height: 148 }
  ],

  bleedPresetsMm: [0, 2, 5],

  cutting: {
    defaultMode: "commonCut",
    defaultGapMm: 0,
    allowPerAxisGap: true
  },

  turnModes: {
    defaultId: "horizontalLeftToRight",
    items: [
      {
        id: "horizontalLeftToRight",
        reverseRows: false,
        reverseColumns: true
      }
    ]
  },

  orientation: {
    sourceHead: "↑",
    horizontalMirrorMap: { "↑": "↑", "↓": "↓", "→": "←", "←": "→" }
  },

  fillOrder: {
    defaultId: "rowMajor",
    groupIdenticalWhenPossible: true
  },

  hardConstraints: {
    zeroUnderproduction: true,
    forbidDashOnFront: true,
    requireMatchingCellCount: true,
    requireValidBackMirror: true,
    requireOrientationArrows: true,
    requirePositiveUsableArea: true,
    requireFullFrontByDefault: true
  },

  optimization: {
    defaultPriorities: [
      "physicalPaper",
      "plateCount",
      "totalOverrun",
      "pressPasses",
      "splitJobCount",
      "contiguousGrouping",
      "differentJobsPerImposition"
    ],
    returnNamedAlternatives: [
      "minimumPaper",
      "minimumPlates",
      "minimumOverrun",
      "minimumPressPasses",
      "assemblyFriendly",
      "recommended"
    ],
    useParetoFilter: true
  },

  schemeStyle: {
    background: "#ffffff",
    borderWidthPx: 2,
    cellBorderWidthPx: 1,
    pagePaddingMm: 10,
    screenshotModeHidesControls: true
  },

  pdfExport: {
    oneSchemePerPage: true,
    defaultPageMode: "fitA4",
    preserveAspectRatio: true,
    includeSummaryInSchemePdf: false,
    schemeOrder: "frontThenBack"
  },

  fileNaming: {
    displayFrontRu: "ЛИСТ-{n}_ЛИЦО",
    displayBackRu: "ЛИСТ-{n}_ОБОРОТ",
    displayFrontEn: "SHEET-{n}_FRONT",
    displayBackEn: "SHEET-{n}_BACK",
    combinedPdf: "uImposition-schemes.pdf"
  },

  storage: {
    localStorageKey: "uImposition.project",
    schemaVersion: 1,
    persistPanelCollapsedState: false
  },

  i18n: {
    ru: {
      calculate: "Рассчитать",
      exportPdf: "Экспорт PDF",
      schemeOnly: "Только схема",
      settings: "Настройки",
      paper: "Физические листы",
      plates: "Печатные формы",
      overrun: "Перетираж",
      underproduction: "Недопечатка"
    },
    en: {
      calculate: "Calculate",
      exportPdf: "Export PDF",
      schemeOnly: "Scheme only",
      settings: "Settings",
      paper: "Physical sheets",
      plates: "Printing plates/forms",
      overrun: "Overrun",
      underproduction: "Underproduction"
    }
  }
});

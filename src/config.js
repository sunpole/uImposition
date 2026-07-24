/**
 * uImposition runtime configuration.
 * Все изменяемые производственные значения находятся здесь.
 * All editable production values are centralized here.
 */
export const CONFIG = Object.freeze({
  app: {
    name: "uImposition",
    defaultLanguage: "ru",
    supportedLanguages: ["ru", "en"],
    unit: "mm",
  },

  sheetPresets: [
    { id: "616x446", label: "616 × 446", width: 616, height: 446, sizeStage: "afterTrim" },
    { id: "616x466", label: "616 × 466", width: 616, height: 466, sizeStage: "afterTrim" },
    { id: "636x448", label: "636 × 448", width: 636, height: 448, sizeStage: "afterTrim" },
    { id: "646x466", label: "646 × 466", width: 646, height: 466, sizeStage: "afterTrim" },
    { id: "650x313", label: "650 × 313", width: 650, height: 313, sizeStage: "afterTrim" },
    { id: "716x326", label: "716 × 326", width: 716, height: 326, sizeStage: "afterTrim" },
    { id: "716x336", label: "716 × 336", width: 716, height: 336, sizeStage: "afterTrim" },
    { id: "716x516", label: "716 × 516", width: 716, height: 516, sizeStage: "afterTrim" },
  ],

  defaults: {
    sheetPresetId: "custom",
    sheetWidth: 620,
    sheetHeight: 450,
    sizeStage: "beforeTrim",
    trimEnabled: true,
    trimUniform: true,
    trimUniformMm: 2,
    trimSidesMm: { left: 2, right: 2, top: 2, bottom: 2 },
    pressMarginsMm: { left: 4, right: 4, top: 2, bottom: 13 },
    ordersText: "",
  },

  limits: {
    minDimensionMm: 1,
    maxDimensionMm: 2000,
    minTrimMm: 0,
    maxTrimMm: 50,
    minPressMarginMm: 0,
    maxPressMarginMm: 100,
    maxOrders: 500,
    maxPagesPerFile: 10000,
    maxQuantity: 100000000,
    decimalStepMm: 0.1,
  },

  storage: {
    projectKey: "uImposition.m1.project",
    languageKey: "uImposition.language",
    persistPanelCollapsedState: false,
  },

  demo: {
    queryParameter: "demo",
    controlCaseUrl: "./data/control-case.json",
  },

  i18n: {
    ru: {
      customPreset: "Произвольный размер",
      beforeTrim: "Размер до зачистки",
      afterTrim: "Размер уже после зачистки",
      noOrders: "Заказы пока не введены",
      orderCount: "Файлов",
      printPairCount: "Печатных пар",
      totalQuantity: "Сумма тиражей",
      invalidInput: "Проверьте выделенные поля",
      stageAfterTrimHint: "Этот пресет уже указан после зачистки. Повторное уменьшение не применяется.",
      stageBeforeTrimHint: "Из исходного размера будут вычтены значения зачистки.",
      loadedControlCase: "Контрольный набор загружен",
      loadFailed: "Не удалось загрузить контрольный набор",
    },
    en: {
      customPreset: "Custom size",
      beforeTrim: "Size before sheet trim",
      afterTrim: "Size already after sheet trim",
      noOrders: "No orders entered yet",
      orderCount: "Files",
      printPairCount: "Print pairs",
      totalQuantity: "Total run length",
      invalidInput: "Check the highlighted fields",
      stageAfterTrimHint: "This preset is already post-trim. No second trim reduction is applied.",
      stageBeforeTrimHint: "The configured trim values will be subtracted from the source sheet.",
      loadedControlCase: "Control dataset loaded",
      loadFailed: "Could not load the control dataset",
    },
  },
});

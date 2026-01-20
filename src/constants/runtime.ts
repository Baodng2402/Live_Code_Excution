export const SUPPORTED_LANGUAGES = ["javascript", "python"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_EXECUTION = {
  javascript: {
    ext: "js",
    cmd: "node",
  },
  python: {
    ext: "py",
    cmd: "python3",
  },
} as const satisfies Record<SupportedLanguage, { ext: string; cmd: string }>;

export const MAX_CODE_SIZE = 10_000; 

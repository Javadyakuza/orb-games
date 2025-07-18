import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  globalSetup: "./jest.setup.ts",
  testEnvironment: "node",
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  moduleFileExtensions: [
    "js",
    "mjs",
    "cjs",
    "jsx",
    "ts",
    "mts",
    "cts",
    "tsx",
    "json",
    "node",
    "d.ts",
  ],
};

export default config;

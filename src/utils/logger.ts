const PREFIX = '[Atahon]';

export const Logger = {
  debug: (module: string, ...args: unknown[]) =>
    console.log(`${PREFIX}[${module}]`, ...args),
  info: (module: string, ...args: unknown[]) =>
    console.log(`${PREFIX}[${module}]`, ...args),
  warn: (module: string, ...args: unknown[]) =>
    console.warn(`${PREFIX}[${module}]`, ...args),
  error: (module: string, ...args: unknown[]) =>
    console.error(`${PREFIX}[${module}]`, ...args),
};

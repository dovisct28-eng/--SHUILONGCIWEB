// Git checkout may convert line endings; preserve all other source differences.
export const normalizeSourceLineEndings = source => source.replace(/\r\n/g, '\n');

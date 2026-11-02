import { readPublicConfig } from './publicEnvironment.js';
export const appConfig = Object.freeze(readPublicConfig(import.meta.env || {}));

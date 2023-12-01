import { HashGeneratorError } from './error';

const _globalThis = (function () {
  if (typeof globalThis !== 'undefined') {
    return globalThis;
  }
  if (typeof self !== 'undefined') {
    return self;
  }
  if (typeof window !== 'undefined') {
    return window;
  }
  if (typeof global !== 'undefined') {
    return global;
  }
  throw new HashGeneratorError('Unable to locate global `this`');
})();

export const IS_WASM_SUPPORTED =
  _globalThis.WebAssembly !== undefined &&
  typeof _globalThis.WebAssembly.instantiate === 'function';

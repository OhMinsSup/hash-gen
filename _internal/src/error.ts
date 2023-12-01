export class HashGeneratorError extends Error {
  constructor(message: string, opts?: { cause: unknown }) {
    // @ts-ignore https://v8.dev/features/error-cause
    super(message, opts);
    this.name = 'HashGeneratorError';

    // Polyfill cause for other runtimes
    if (opts?.cause && !this.cause) {
      this.cause = opts.cause;
    }
  }
}

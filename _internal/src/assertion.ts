export const isPromise = <T = any>(p: any): p is Promise<T> => {
  return p !== null && typeof p === 'object' && typeof p.then === 'function';
};

export const isFunction = <T extends Function = Function>(
  value: any,
): value is T => {
  return typeof value === 'function';
};

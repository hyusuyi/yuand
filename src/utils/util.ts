export const isObject = (oj: unknown) =>
  Object.prototype.toString.call(oj) === "[object Object]";
export const isFunction = (oj: unknown) =>
  Object.prototype.toString.call(oj) === "[object Function]";

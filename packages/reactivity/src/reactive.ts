import { isObject } from "@vue/shared";
import { mutableHandlers } from "./baseHandlers";

export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
}

const reactiveMap = new WeakMap(); // 使用 WeakMap 防止内存泄漏
export function reactive(target) {
  // 1. reactive 只代理对象
  if (!isObject(target)) {
    return target;
  }
  // 2. 如果已经被代理过，则直接返回
  // 取 target[ReactiveFlags.IS_REACTIVE] 时，如果target已经被代理过，则会走到get函数，返回true
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target;
  }
  // 3. 不重复代理同一对象
  const existProxy = reactiveMap.get(target);
  if (existProxy) {
    return existProxy;
  }
  // 4. 创建代理
  const proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy); // target -> proxy 的映射表
  return proxy;
}

import { isReactive } from "./reactive";
import { ReactiveEffect } from "./effect";
import { isFunction, isObject } from "@vue/shared";

// 深度监听
function traverse(source, s = new Set()) {
  if (!isObject(source)) {
    return source;
  }
  if (s.has(source)) {
    return source;
  }
  s.add(source);
  for (let key in source) {
    // 递归取值，取值过程就是收集依赖的过程，即实现了深度监听
    traverse(source[key], s);
  }
  return source;
}

function doWatch(source, cb, { immediate } = {} as any) {
  let getter;
  // 【关键】watch第一个参数是对象时，该对象必须是响应式的
  if (isReactive(source)) {
    // watch第一个参数是响应式对象时，默认需要开启深度监听（通过traverse递归取值实现）
    getter = () => traverse(source);
  } else if (isFunction(source)) {
    getter = source;
  }
  let oldValue;
  // watcher effect 的依赖变化时，就会执行scheduler（即job）
  const job = () => {
    // 2.1. 如果是watch API，在 scheduler 中调用 cb
    if (cb) {
      let newValue = effect.run(); // 再次执行effect.run()，即再次执行getter，拿到新值
      cb(newValue, oldValue);
      oldValue = newValue;
    } else {
      // 2.2. 如果是 watchEffect API，在 scheduler 中再次执行 effect.run
      effect.run();
    }
  };
  const effect = new ReactiveEffect(getter, job);
  // immediate为true会默认先执行一次回调
  if (immediate) {
    return job();
  }
  oldValue = effect.run(); // 1. 执行getter，收集依赖
}

/**
 * watch 和 watchEffect的区别：
 * 1. watch 就是一个 effect + 自定义scheduler（在scheduler中执行回调cb）
 * 2. watchEffect 就是一个 effect（只是在scheduler中执行 effect.run() 而已）
 */
export function watch(source, cb, options) {
  doWatch(source, cb, options);
}
export function watchEffect(effect, options) {
  doWatch(effect, null, options);
}

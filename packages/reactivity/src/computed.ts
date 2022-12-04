import { isFunction } from "@vue/shared";
import {
  ReactiveEffect,
  activeEffect,
  trackEffects,
  triggerEffects,
} from "./effect";

const noop = () => {};
class ComputedRefImpl {
  dep = undefined;
  effect;
  __v_isRef = true;
  _dirty = true; // 是否需要重新计算
  _value; // 计算属性的缓存结果
  constructor(getter, public setter) {
    this.effect = new ReactiveEffect(getter, () => {
      // 属性更新时，触发trigger重新执行effect，但是不执行run，而是执行scheduler，将dirty设为true，下次取值时重新计算；
      // 2. 并且触发 this.dep 中所有effect（即计算属性作为依赖的effect）执行
      this._dirty = true;
      triggerEffects(this.dep);
    });
  }
  // get 和 set 是类的属性访问器，等价于 Object.defineProperty() 中的get、set
  get value() {
    if (activeEffect) {
      // 1. 读取计算属性时，如果存在activeEffect，意味着这个计算属性在effect中使用，需要让这个计算属性收集这个effect
      trackEffects(this.dep || (this.dep = new Set()));
    }

    if (this._dirty) {
      // 取值时才执行effect，并且把取到的值缓存起来
      this._value = this.effect.run(); // 执行计算属性的 getter，会进行依赖收集
      this._dirty = false;
    }
    return this._value;
  }
  set value(newValue) {
    this.setter(newValue);
  }
}

export function computed(getterOrOptions) {
  let onlyGetter = isFunction(getterOrOptions);
  let getter;
  let setter;
  if (onlyGetter) {
    getter = getterOrOptions;
    setter = noop;
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set || noop;
  }

  return new ComputedRefImpl(getter, setter);
}

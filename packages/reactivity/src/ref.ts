import { isObject } from "@vue/shared";
import { reactive } from "./reactive";
import { activeEffect, trackEffects, triggerEffects } from "./effect";

export function ref(value) {
  return new RefImp(value);
}

function toReactive(value) {
  return isObject(value) ? reactive(value) : value;
}
class RefImp {
  dep = undefined;
  _value;
  __v_isRef = true;
  constructor(public rawValue) {
    // 如果 ref 传入的是对象，则用reactive将它变成响应式的
    this._value = toReactive(rawValue);
  }
  get value() {
    // 依赖收集
    if (activeEffect) {
      trackEffects(this.dep || (this.dep = new Set()));
    }
    return this._value;
  }
  set value(newValue) {
    if (newValue !== this.rawValue) {
      // 更新数据：newValue 也需要用 toReactive 进行处理
      this._value = toReactive(newValue);
      this.rawValue = newValue;
      // 触发effect更新
      triggerEffects(this.dep);
    }
  }
}

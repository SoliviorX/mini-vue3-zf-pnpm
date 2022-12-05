import { isObject } from "@vue/shared";
import { reactive } from "./reactive";
import { activeEffect, trackEffects, triggerEffects } from "./effect";

export function ref(value) {
  return new RefImpl(value);
}
function toReactive(value) {
  return isObject(value) ? reactive(value) : value;
}
class RefImpl {
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

export function toRef(target, key) {
  return new ObjectRefImpl(target, key);
}
class ObjectRefImpl {
  __v_isRef = true;
  constructor(public _object, public _key) {}
  get value() {
    return this._object[this._key];
  }
  set value(newValue) {
    this._object[this._key] = newValue;
  }
}

// toRefs 本质是遍历对象，对每一个属性使用toRef进行代理
export function toRefs(object) {
  const ret = {};
  for (let key in object) {
    ret[key] = toRef(object, key);
  }
  return ret;
}

/**
 * proxyRefs 用proxy代理一个对象
 * 1. 如果对象属性是Ref类型，则将get和set都代理到该属性的 value 属性上
 * 2. 如果对象属性不是Ref类型，则正常取值和设值
 */
export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key, receiver) {
      let v = Reflect.get(target, key, receiver);
      return v.__v_isRef ? v.value : v;
    },
    set(target, key, value, receiver) {
      const oldValue = target[key];
      if (oldValue.__v_isRef) {
        oldValue.value = value;
        return true;
      }
      return Reflect.set(target, key, value, receiver);
    },
  });
}

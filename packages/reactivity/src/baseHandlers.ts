import { ReactiveFlags } from "./reactive";
import { track, trigger } from "./effect";

export const mutableHandlers = {
  // receiver 是当前的代理对象
  get(target, key, receiver) {
    // 通过下列判断，解决不重复代理已经代理过的对象
    if (ReactiveFlags.IS_REACTIVE === key) {
      return true;
    }
    /**
     * 【问题描述】为何不能直接通过 target[key] 取值？
     * 现有一个对象person：
     * let person = {
     *    name: 'jw',
     *    get aliasName() {
     *        return 'alias' + this.name
     *    }
     * }
     * 当通过 person.aliasName 取值时，内部的 this.name （this指向person）是通过 person.name 读取的，不会触发响应式；
     * 【解决方式】而改成 Reflect.get(target, key, receiver) 后，this 指向 receiver，this.name 即 personProxy.name，依然会触发响应式；
     */
    track(target, key);
    return Reflect.get(target, key, receiver); // 【使用 Reflect.get 处理了 target 内部的 this 指向问题】
  },
  set(target, key, value, receiver) {
    let oldValue = target[key];
    const r = Reflect.set(target, key, value, receiver); // Reflect.set 返回一个boolean值
    if (oldValue !== value) {
      trigger(target, key, value, oldValue);
    }
    return r;
  },
};

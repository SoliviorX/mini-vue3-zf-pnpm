// packages/reactivity/src/effect.ts
function cleanupEffect(effect2) {
  let { deps } = effect2;
  for (let i = 0; i < deps.length; i++) {
    deps[i].delete(effect2);
  }
  effect2.deps.length = 0;
}
var activeEffect;
var ReactiveEffect = class {
  constructor(fn, scheduler) {
    this.active = true;
    this.deps = [];
    this.parent = void 0;
    this.fn = fn;
    this.scheduler = scheduler;
  }
  run() {
    if (!this.active) {
      return this.fn();
    }
    try {
      this.parent = activeEffect;
      activeEffect = this;
      cleanupEffect(this);
      return this.fn();
    } finally {
      activeEffect = this.parent;
      this.parent = void 0;
    }
  }
  stop() {
    if (this.active) {
      cleanupEffect(this);
      this.active = false;
    }
  }
};
function effect(fn, options = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);
  _effect.run();
  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}
var targetMap = /* @__PURE__ */ new WeakMap();
function track(target, key) {
  if (!activeEffect) {
    return;
  }
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, dep = /* @__PURE__ */ new Set());
  }
  trackEffects(dep);
}
function trackEffects(dep) {
  let shouldTrack = !dep.has(activeEffect);
  if (shouldTrack) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
}
function trigger(target, key, newValue, oldValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  const dep = depsMap.get(key);
  if (dep) {
    triggerEffects(dep);
  }
}
function triggerEffects(dep) {
  const effects = [...dep];
  effects.forEach((effect2) => {
    if (activeEffect !== effect2) {
      if (!effect2.scheduler) {
        effect2.run();
      } else {
        effect2.scheduler();
      }
    }
  });
}

// packages/shared/src/index.ts
function isObject(value) {
  return typeof value === "object" && value !== null;
}
function isFunction(value) {
  return typeof value === "function";
}

// packages/reactivity/src/baseHandlers.ts
var mutableHandlers = {
  get(target, key, receiver) {
    if ("__v_isReactive" /* IS_REACTIVE */ === key) {
      return true;
    }
    track(target, key);
    let r = Reflect.get(target, key, receiver);
    if (isObject(r)) {
      return reactive(r);
    }
    return r;
  },
  set(target, key, value, receiver) {
    let oldValue = target[key];
    const r = Reflect.set(target, key, value, receiver);
    if (oldValue !== value) {
      trigger(target, key, value, oldValue);
    }
    return r;
  }
};

// packages/reactivity/src/reactive.ts
var ReactiveFlags = /* @__PURE__ */ ((ReactiveFlags2) => {
  ReactiveFlags2["IS_REACTIVE"] = "__v_isReactive";
  return ReactiveFlags2;
})(ReactiveFlags || {});
var reactiveMap = /* @__PURE__ */ new WeakMap();
function reactive(target) {
  if (!isObject(target)) {
    return target;
  }
  if (target["__v_isReactive" /* IS_REACTIVE */]) {
    return target;
  }
  const existProxy = reactiveMap.get(target);
  if (existProxy) {
    return existProxy;
  }
  const proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy);
  return proxy;
}

// packages/reactivity/src/computed.ts
var noop = () => {
};
var ComputedRefImpl = class {
  constructor(getter, setter) {
    this.setter = setter;
    this.dep = void 0;
    this.__v_isRef = true;
    this._dirty = true;
    this.effect = new ReactiveEffect(getter, () => {
      this._dirty = true;
      triggerEffects(this.dep);
    });
  }
  get value() {
    if (activeEffect) {
      trackEffects(this.dep || (this.dep = /* @__PURE__ */ new Set()));
    }
    if (this._dirty) {
      this._value = this.effect.run();
      this._dirty = false;
    }
    return this._value;
  }
  set value(newValue) {
    this.setter(newValue);
  }
};
function computed(getterOrOptions) {
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
export {
  ReactiveEffect,
  ReactiveFlags,
  activeEffect,
  computed,
  effect,
  reactive,
  track,
  trackEffects,
  trigger,
  triggerEffects
};
//# sourceMappingURL=reactivity.esm.js.map

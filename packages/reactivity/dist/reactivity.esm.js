// packages/reactivity/src/effectScope.ts
var activeEffectScope;
var EffectScope = class {
  constructor(detached = false) {
    this.active = true;
    this.effects = [];
    if (!detached && activeEffectScope) {
      (activeEffectScope.scopes || (activeEffectScope.scopes = [])).push(this);
    }
  }
  run(fn) {
    if (this.active) {
      try {
        this.parent = activeEffectScope;
        activeEffectScope = this;
        return fn();
      } finally {
        activeEffectScope = this.parent;
        this.parent = null;
      }
    }
  }
  stop() {
    if (this.active) {
      this.effects.forEach((effect2) => {
        effect2.stop();
      });
    }
    if (this.scopes) {
      this.scopes.forEach((scope) => {
        scope.stop();
      });
    }
    this.active = false;
  }
};
function recordEffectScope(effect2) {
  if (activeEffectScope && activeEffectScope.active) {
    activeEffectScope.effects.push(effect2);
  }
}
function effectScope(detached) {
  return new EffectScope(detached);
}

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
    recordEffectScope(this);
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
  triggerEffects(dep);
}
function triggerEffects(dep) {
  if (dep) {
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
function isReactive(target) {
  return !!(target && target["__v_isReactive" /* IS_REACTIVE */]);
}
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

// packages/reactivity/src/watch.ts
function traverse(source, s = /* @__PURE__ */ new Set()) {
  if (!isObject(source)) {
    return source;
  }
  if (s.has(source)) {
    return source;
  }
  s.add(source);
  for (let key in source) {
    traverse(source[key], s);
  }
  return source;
}
function doWatch(source, cb, { immediate } = {}) {
  let getter;
  if (isReactive(source)) {
    getter = () => traverse(source);
  } else if (isFunction(source)) {
    getter = source;
  }
  let oldValue;
  let cleanup;
  function onCleanup(userCb) {
    cleanup = userCb;
  }
  const job = () => {
    if (cb) {
      let newValue = effect2.run();
      if (cleanup) {
        cleanup();
      }
      cb(newValue, oldValue, onCleanup);
      oldValue = newValue;
    } else {
      effect2.run();
    }
  };
  const effect2 = new ReactiveEffect(getter, job);
  if (immediate) {
    return job();
  }
  oldValue = effect2.run();
}
function watch(source, cb, options) {
  doWatch(source, cb, options);
}
function watchEffect(effect2, options) {
  doWatch(effect2, null, options);
}

// packages/reactivity/src/ref.ts
function ref(value) {
  return new RefImpl(value);
}
function toReactive(value) {
  return isObject(value) ? reactive(value) : value;
}
var RefImpl = class {
  constructor(rawValue) {
    this.rawValue = rawValue;
    this.dep = void 0;
    this.__v_isRef = true;
    this._value = toReactive(rawValue);
  }
  get value() {
    if (activeEffect) {
      trackEffects(this.dep || (this.dep = /* @__PURE__ */ new Set()));
    }
    return this._value;
  }
  set value(newValue) {
    if (newValue !== this.rawValue) {
      this._value = toReactive(newValue);
      this.rawValue = newValue;
      triggerEffects(this.dep);
    }
  }
};
function toRef(target, key) {
  return new ObjectRefImpl(target, key);
}
var ObjectRefImpl = class {
  constructor(_object, _key) {
    this._object = _object;
    this._key = _key;
    this.__v_isRef = true;
  }
  get value() {
    return this._object[this._key];
  }
  set value(newValue) {
    this._object[this._key] = newValue;
  }
};
function toRefs(object) {
  const ret = {};
  for (let key in object) {
    ret[key] = toRef(object, key);
  }
  return ret;
}
function proxyRefs(objectWithRefs) {
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
    }
  });
}
export {
  ReactiveEffect,
  ReactiveFlags,
  activeEffect,
  activeEffectScope,
  computed,
  effect,
  effectScope,
  isReactive,
  proxyRefs,
  reactive,
  recordEffectScope,
  ref,
  toRef,
  toRefs,
  track,
  trackEffects,
  trigger,
  triggerEffects,
  watch,
  watchEffect
};
//# sourceMappingURL=reactivity.esm.js.map

export let activeEffectScope;
class EffectScope {
  active = true;
  effects = []; // 用来收集scope内部的effects
  parent; // 通过 parent 处理 effectScope 嵌套的情况
  scopes; // 嵌套scope时，用来收集内层的scope
  constructor(detached = false) {
    // 收集内层非独立的 scope
    if (!detached && activeEffectScope) {
      (activeEffectScope.scopes || (activeEffectScope.scopes = [])).push(this);
    }
  }
  run(fn) {
    if (this.active) {
      try {
        this.parent = activeEffectScope;
        // 执行run时，将当前的effectScope放到全局的activeEffectScope，方便在创建内部的effect时，取到effectScope，并收集内部的effect
        activeEffectScope = this;
        return fn();
      } finally {
        activeEffectScope = this.parent;
        this.parent = null; // 垃圾回收
      }
    }
  }
  stop() {
    if (this.active) {
      this.effects.forEach((effect) => {
        effect.stop(); // 遍历 effectScope 收集的effects，执行它们的 stop 方法
      });
    }
    // 嵌套时，收集的内层 scope 也需要执行 stop
    if (this.scopes) {
      this.scopes.forEach((scope) => {
        scope.stop();
      });
    }
    this.active = false;
  }
}

// 在effectScope.effects中收集相关的effectScope.run 内部的 effect
export function recordEffectScope(effect) {
  if (activeEffectScope && activeEffectScope.active) {
    activeEffectScope.effects.push(effect);
  }
}

export function effectScope(detached) {
  return new EffectScope(detached);
}

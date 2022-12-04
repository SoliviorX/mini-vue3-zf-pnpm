function cleanupEffect(effect) {
  // 每次执行effect之前，都应该将该effect从deps所有属性的dep中清理出去，以及清空effect的deps数组
  let { deps } = effect;
  for (let i = 0; i < deps.length; i++) {
    deps[i].delete(effect);
  }
  effect.deps.length = 0;
}

export let activeEffect;
export class ReactiveEffect {
  public fn;
  private scheduler;
  public active = true;
  public deps = [];
  public parent = undefined;
  constructor(fn, scheduler) {
    this.fn = fn;
    this.scheduler = scheduler;
  }
  run() {
    if (!this.active) {
      return this.fn();
    }
    // 通过设置parent属性，确保在嵌套effect中activeEffect的准确性
    try {
      this.parent = activeEffect;
      activeEffect = this;
      /**
       * 【意料之外的重新渲染】：每次触发 trigger 重新执行effect.run()，此时effect的依赖项可能发生变化（可能会删除之前的依赖或新增新的依赖），如果之前的依赖被删掉了，那么就需要清除之前收集的依赖，不然当该依赖变化时会重新执行effect，与预期不符。
       * 【解决方式】：在run中执行fn之前，先清除 effect.deps 中所有dep对应的effect，然后执行fn，会重新进行依赖收集
       */
      cleanupEffect(this);
      return this.fn(); // 执行fn的时候就会取值，取值的时候收集当前的activeEffect
    } finally {
      activeEffect = this.parent;
      this.parent = undefined;
    }
  }
  stop() {
    // 先将effect的依赖全部删除掉，然后将它变成失活态
    if (this.active) {
      cleanupEffect(this);
      this.active = false;
    }
  }
}

export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);
  _effect.run();
  const runner = _effect.run.bind(_effect); // 保证_effect执行的时候this是当前的effect
  runner.effect = _effect;
  return runner;
}

/**
 * 双向依赖收集
 */
const targetMap = new WeakMap();
export function track(target, key) {
  // 1. 如果取值操作没有发生在effect中，直接返回，不会进行依赖收集
  if (!activeEffect) {
    return;
  }
  // 2. 从映射表中读取属性对应的dep
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }
  // 3. 依赖收集
  trackEffects(dep);
}
export function trackEffects(dep) {
  let shouldTrack = !dep.has(activeEffect);
  // 双向收集：一个属性可能对应多个effect，一个effect可能对应多个属性
  if (shouldTrack) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
}

/**
 * 触发更新
 */
export function trigger(target, key, newValue, oldValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  const dep = depsMap.get(key);
  if (dep) {
    triggerEffects(dep);
  }
}
export function triggerEffects(dep) {
  const effects = [...dep];
  // 执行dep中所有effect的run方法
  effects.forEach((effect) => {
    /**
     * 【问题描述】如果在effect内部修改依赖，会触发effect重新执行，造成死循环；
     * effect(() => {
     *  state.age = Math.random();  // 在effect内部修改state，如果此时重新执行当前的activeEffect，会造成死循环
     *  app.innerHTML = state.age
     * })
     * 所以重新执行effect时需要判断重新执行的effect是否是当前的activeEffect，如果是当前的activeEffect，则不重新执行
     */
    if (activeEffect !== effect) {
      // 触发trigger时，有effect.scheduler时执行【scheduler】，没有scheduler时才执行run
      if (!effect.scheduler) {
        effect.run();
      } else {
        effect.scheduler();
      }
    }
  });
}

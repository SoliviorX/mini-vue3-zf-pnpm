function createInvoker(initialValue) {
  const invoker = (e) => invoker.value(e);
  // 将事件的回调绑定到 invoker.value 上，后续更新事件回调的时候，只需更新 invoker.value 即可
  invoker.value = initialValue;
  return invoker;
}

export const patchEvent = (el, key, nextValue) => {
  const invokers = el._vei || (el._vei = {}); // _vei 是 vue event invoker 的缩写
  const name = key.slice(2).toLowerCase(); // 事件名
  const existingInvoker = invokers[name]; // 取缓存

  // 1. 如果是更新事件的回调
  if (nextValue && existingInvoker) {
    existingInvoker.value = nextValue;
  } else {
    // 2. 如果是绑定新的事件
    if (nextValue) {
      // 创建 invoker 并缓存起来
      const invoker = (invokers[name] = createInvoker(nextValue));
      el.addEventListener(name, invoker);
    } else {
      // 3. 如果是移除事件
      el.removeEventListener(name, existingInvoker);
      invokers[name] = null;
    }
  }
};

export const patchStyle = (el, prev, next) => {
  if (next) {
    const style = el.style;
    // 1. 将新的样式添加到style上，如果有重复的直接覆盖
    for (let key in next) {
      style[key] = next[key];
    }

    for (let key in prev) {
      // 2. 老的有，新的没有，要移除掉
      if (next[key] == null) {
        style[key] = null;
      }
    }
  } else {
    el.removeAttribute("style");
  }
};

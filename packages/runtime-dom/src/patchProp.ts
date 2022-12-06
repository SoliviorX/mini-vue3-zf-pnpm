import { patchAttr } from "./modules/attr";
import { patchClass } from "./modules/class";
import { patchEvent } from "./modules/event";
import { patchStyle } from "./modules/style";

export const patchProp = (el, key, prevValue, nextValue) => {
  if (key === "class") {
    // 1. class 类名
    patchClass(el, nextValue);
  } else if (key === "style") {
    // 2. 样式
    patchStyle(el, prevValue, nextValue);
  } else if (/^on[^a-z]/.test(key)) {
    // 3. onXxx 事件
    patchEvent(el, key, nextValue);
  } else {
    // 4. 其它 attributes 属性
    patchAttr(el, key, nextValue);
  }
};

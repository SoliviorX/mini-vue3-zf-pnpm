import { isArray, isObject } from "@vue/shared";
import { isVNode, createVNode } from "./vnode";

// h 函数就是通过区分不同的传参情况，调用createVNode创建虚拟节点
export function h(type, propsOrChildren?, children?) {
  const l = arguments.length;
  if (l === 2) {
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      // 1. h(type, h(...))
      if (isVNode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren]);
      }
      // 2. h(type, props)
      return createVNode(type, propsOrChildren);
    } else {
      // 3. h(type, [...children]) 或 h(type, '文本')
      return createVNode(type, null, propsOrChildren);
    }
  } else {
    // l = 1 或 l >= 3
    if (l > 3) {
      // 4. h(type, {}, child1, child2, child3)
      children = Array.from(arguments).slice(2);
    } else if (l === 3 && isVNode(children)) {
      // 5. h(type, props, h(...))
      children = [children];
    }
    return createVNode(type, propsOrChildren, children);
  }
}

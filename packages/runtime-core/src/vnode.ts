import { isArray, isString, ShapeFlags } from "@vue/shared";

export function isVNode(vnode) {
  return vnode.__v_isVnode == true;
}
export function isSameVNode(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}
export function createVNode(type, props = null, children = null) {
  // 用标识区分不同的虚拟节点类型（组件、元素、文本、自定义的 keep-alive/Teleport等）
  const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0; // 即 0001 或 0000
  const vnode = {
    __v_isVnode: true,
    type,
    props,
    children,
    shapeFlag,
    key: props?.key,
    else: null, // 对应的真实节点
  };
  if (children) {
    let childrenType = 0;
    if (isArray(children)) {
      childrenType = ShapeFlags.ARRAY_CHILDREN; // 1 << 4
    } else {
      childrenType = ShapeFlags.TEXT_CHILDREN; // 1 << 3
    }
    // vnode.shapeFlag 除了记录vnode本身的类型，还需要记录children的类型是数组还是文本（| 操作符会在二进制对应的位上进行相加运算，相当于记录了children的类型）
    vnode.shapeFlag = vnode.shapeFlag | childrenType;
  }
  return vnode;
}

export const enum ShapeFlags {
  ELEMENT = 1, // 虚拟节点是一个元素
  FUNCTIONAL_COMPONENT = 1 << 1, // 函数式组件
  STATEFUL_COMPONENT = 1 << 2, // 状态组件，即普通组件
  TEXT_CHILDREN = 1 << 3, // 儿子是文本
  ARRAY_CHILDREN = 1 << 4, // 儿子是数组
  SLOTS_CHILDREN = 1 << 5, // 插槽
  TELEPORT = 1 << 6, // teleport
  SUSPENSE = 1 << 7, // suspense
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8, // 是否需要keep-alive
  COMPONENT_KEPT_ALIVE = 1 << 9, // 组件是否经过keep-alive
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT, // 函数式组件或普通组件
}

/**
 * 位运算符针对于二进制数：
 * 1. 左移运算符 <<
 *   FUNCTIONAL_COMPONENT = 1 << 1  即 00000001 往前移一位，变成 00000010，即十进制的 2
 *   STATEFUL_COMPONENT = 1 << 2  即 00000001 往前移两位，变成 00000100，即十进制的 4
 * 2. 或运算 |：两个位都为0时，结果才为0；有一个为1，结果就为1
 *    COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT，即 00000010 | 00000100， | 运算符的规则是对应的位上有一个位1即为1，则合并进行位运算结果为 00000110，即十进制的 6
 * 3. 与运算 &：两个位都为1时，结果才为1
 *    判断一个Vnode是否是函数式组件：ShapeFlags.COMPONENT & ShapeFlags.FUNCTIONAL_COMPONENT，即 00000110 & 00000100，对应位上进行与操作，两者都为1结果才为1，则结果为00000100，大于0，说明该vnode是函数式组件
 *    在实际判断 vnode.shapeFlag 是什么类型时，就用 vnode.shapeFlag & ShapeFlags.xxx，结果大于1 则说明该vnode包含该类型。
 */

import { ShapeFlags } from "@vue/shared";
import { isSameVNode } from "./vnode";

export function createRenderer(options) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    createComment: hostCreateComment,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
  } = options;

  // 渲染children，本质是递归调用patch
  const mountChildren = (children, el) => {
    for (let i = 0; i < children.length; i++) {
      patch(null, children[i], el);
    }
  };
  // 卸载children
  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i]);
    }
  };

  // 创建元素dom
  const mountElement = (vnode, container, anchor) => {
    const { type, props, children, shapeFlag } = vnode;
    // 1. 创建真实dom，并保存到 vnode.el 上
    const el = (vnode.el = hostCreateElement(type));
    // 2. 增添属性
    if (props) {
      for (let key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    // 3. 渲染children：children 可能是文本或数组
    if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el);
    } else if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children);
    }
    // 4. 插入到页面
    hostInsert(el, container, anchor);
  };

  // 更新props
  const pacthProps = (oldProps, newProps, el) => {
    if (oldProps !== newProps) {
      // 新的与老的不同，用新的覆盖老的
      for (let key in newProps) {
        const prev = oldProps[key];
        const next = newProps[key];
        if (prev !== next) {
          hostPatchProp(el, key, prev, next);
        }
      }
      // 老的存在，新的没有，则删掉老的
      for (let key in oldProps) {
        const prev = oldProps[key];
        if (!(key in newProps)) {
          hostPatchProp(el, key, prev, null);
        }
      }
    }
  };

  // Diff 算法
  const patchKeyedChildren = (c1, c2, el) => {
    // TODO...  block tree、patchFlags
    // 同级比较 + 深度遍历
    let i = 0;
    let e1 = c1.length - 1; // prevChildren ending index
    let e2 = c2.length - 1; // nextChildren ending index

    /**
     * 1. 从前往后比
     * (a b) c    ——>
     * (a b) d e
     */
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVNode(n1, n2)) {
        // 递归执行 patch
        patch(n1, n2, el);
      } else {
        break; // break 用于完全结束循环体，跳出循环
      }
      i++;
    }

    /**
     * 2. 从后往前比
     * a (b c)    ——>
     * d e (b c)
     */
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVNode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      e1--;
      e2--;
    }

    /**
     * 3. 在老的 children 后面或前面插入新值
     * (a b) ——> (a b) c，此时 i = 2, e1 = 1, e2 = 2
     * (a b) ——> c (a b)，此时 i = 0, e1 = -1, e2 = 0
     * 即当 i > e1时，说明老的比新的短（e1 < e2），有新增
     */
    if (i > e1) {
      // i一定是要小于e2的
      if (i <= e2) {
        // 循环创建新元素
        while (i <= e2) {
          // 如果e2往前移动了，那么e2的下一个值一定存在，说明向前插入
          const nextPos = e2 + 1;
          // anchor 即插入元素时的锚点，为null时直接插入到末尾
          // vue2 是看下一个元素存不存在，vue3是看下一个元素的长度是否越界
          const anchor = nextPos < c2.length ? c2[nextPos].el : null;
          patch(null, c2[i], el, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      /**
       * 4. 从老的 children 前面或后面删去一部分节点
       * (a b) c ——> (a b)，此时 i = 2, e1 = 2, e2 = 1
       * a (b c) ——> (b c)，此时 i = 0, e1 = 0, e2 = -1
       * 即当 i > e2时，说明老的比新的长（e1 > e2），有删减
       */
      while (i <= e1) {
        unmount(c1[i]);
        i++;
      }
    } else {
      /**
       * 5.
       * a b [c d e] f g ——>  a b [e c d h] f g，此时 i = 2, e1 = 4, e2 = 5
       */
      let s1 = i; // prevChildren starting index
      let s2 = i; // nextChildren starting index
      // vue2中根据老节点创建映射表，vue3中根据新的key创建映射表
      const keyToNewIndexMap = new Map(); // newKey ——> newIndex
      // 遍历 s2-e2 片段，创建映射表，存储newChildren中的索引
      for (i = s2; i <= e2; i++) {
        const vnode = c2[i];
        keyToNewIndexMap.set(vnode.key, i);
      }
      // 需要更新的节点个数
      const toBePatched = e2 - s2 + 1;
      // 创建一个数组，用来标记 s2-e2 片段节点是否被patch过，初始值为0，patch过则设为 oldIndex + 1
      const newIndexToOldIndex = new Array(toBePatched).fill(0); // [0,0,0,0]
      // 遍历 s1-e1 片段，查找老节点是否存在于 newChildren 中，然后进行卸载或递归patch
      for (i = s1; i <= e1; i++) {
        const child = c1[i];
        // 通过key查找老节点在newChildren中对应的索引
        let newIndex = keyToNewIndexMap.get(child.key);
        // 5.1.1 老的里面有，新的没有，则删除老节点
        if (newIndex == undefined) {
          unmount(child);
        } else {
          // 5.1.2 老的和新的里面都有，则比对两个节点，尽可能复用老节点
          // patch过的节点，在 newIndexToOldIndex 中记录为 oldIndex + 1（加1是为了避免oldIndex为0时，与初始值0冲突，造成语义不清）
          newIndexToOldIndex[newIndex - s2] = i + 1;
          patch(child, c2[newIndex], el); // patch 更新节点
          // 截至目前，只是对相同的vnode进行了更新，并没有移动老节点的顺序，也没有在 newChildren里面添加新增的节点
        }
      }
      // console.log(newIndexToOldIndex); // [5,3,4,0]
      // 5.2 创建新节点；调整节点顺序
      const seq = getSequence(newIndexToOldIndex); // 创建最长递增子序列  [1,2]
      let j = seq.length - 1;
      for (let i = toBePatched - 1; i >= 0; i--) {
        // a b [e c d h] f g
        const nextIndex = s2 + i; // 获取节点的索引
        const nextChild = c2[nextIndex]; // 获取节点vnode
        // 获取锚点：锚点即获取的节点的下一个节点
        const anchor = nextIndex + 1 < c2.length ? c2[nextIndex + 1].el : null;
        if (newIndexToOldIndex[i] == 0) {
          // 如果是新元素则创建元素，再插入
          patch(null, nextChild, el, anchor);
        } else {
          // 【最长递增子序列优化】只有当 i 不是最长递增子序列中的索引时，才移动元素位置
          if (j < 0 || i !== seq[j]) {
            hostInsert(nextChild.el, el, anchor); // insert 是移动节点
          } else {
            j--;
          }
        }
      }
    }
  };

  // 更新 children
  const patchChildren = (n1, n2, el) => {
    // 比较两个vnode的children，更新el中的children
    const c1 = n1.children;
    const c2 = n2.children;
    const prevShapeFlag = n1.shapeFlag;
    const shapeFlag = n2.shapeFlag;
    // 1. c2 是文本
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 如果 c1 是数组
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 把老的children删除
        unmountChildren(c1);
      }
      // 设置新的文本内容
      if (c1 !== c2) {
        hostSetElementText(el, c2);
      }
    } else {
      // 2. c2 是数组或 null
      // 2.1 c1 是数组
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 2.1.1  c1、c2 都是数组
          // 【diff 算法】
          patchKeyedChildren(c1, c2, el);
        } else {
          // 2.1.2  c1 是数组，c2 是 null，删除老的children
          unmountChildren(c1);
        }
      } else {
        // 2.2 c1 文本或null
        // 2.2.1  c1 是文本（c2是数组或null），则直接删除文本，删除后c1变成了null
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, "");
        }
        // 2.2.2  当 c1 是 null，c2是children时，渲染c2（c2是null，c1也是null时，不做处理）
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el);
        }
      }
    }
  };

  const patchElement = (n1, n2) => {
    let el = (n2.el = n1.el);
    const oldProps = n1.props || {};
    const newProps = n2.props || {};
    // 更新props
    pacthProps(oldProps, newProps, el);
    // 更新 children
    patchChildren(n1, n2, el);
  };
  const processElement = (n1, n2, container, anchor) => {
    if (n1 == null) {
      // 将n2渲染成真实dom
      mountElement(n2, container, anchor);
    } else {
      // diff 算法
      patchElement(n1, n2);
    }
  };

  // 初次渲染或更新vnode
  const patch = (n1, n2, container, anchor = null) => {
    if (n1 == n2) {
      return;
    }
    // 如果n1、n2都有值，但不是sameVNode，则删除n1，渲染n2
    if (n1 && !isSameVNode(n1, n2)) {
      unmount(n1);
      n1 = null; // 在 processElement 中会判定，当n1为null时，直接渲染n2
    }
    processElement(n1, n2, container, anchor);
  };

  // 卸载vnode
  const unmount = (vnode) => hostRemove(vnode.el);

  const render = (vnode, container) => {
    if (vnode == null) {
      // 卸载：删除节点
      // container._vnode上是container内渲染过的vnode，只有当container渲染过了才进行卸载
      if (container._vnode) {
        unmount(container._vnode);
      }
    } else {
      // 初次渲染 或 更新
      patch(container._vnode || null, vnode, container);
    }
    // 将虚拟节点保存到真实节点的 _vnode 属性上
    container._vnode = vnode;
  };
  return {
    render,
  };
}

/**
 * 求最长递增子序列
 */
function getSequence(arr) {
  let len = arr.length;
  let result = [0]; // result 是递增子序列元素在arr中的索引值组成的数组，默认先将arr第一个元素放进去比较
  let resultLastIndex;

  let start;
  let end;
  let middle;

  /**
   * 【问题描述】用当前值替换掉result中存储的较大值，会因为插队，导致结果与预期不同
   * 【解决方案】在新的值插入到队列中时，永远记住前一个元素的索引，以访别人插队；最后追溯正确的结果
   */
  let p = arr.slice(0); // 用来记录入队时记录前面成员的索引

  for (let i = 0; i < len; i++) {
    const arrI = arr[i];
    // 在vue中，序列中不会出现0，因为0是新增的节点，会通过patch传入anchor进行创建和插入。如果出现0，直接忽略。
    if (arrI !== 0) {
      /**
       * 贪心算法：只要当前值大于 result 最后索引对应的arr元素值，则将当前索引push到result中
       */
      resultLastIndex = result[result.length - 1];
      if (arr[resultLastIndex] < arrI) {
        result.push(i);
        p[i] = resultLastIndex; // 入队时记录前面成员的索引
        continue; // 跳出本次循环，进入下一次循环
      }

      /**
       * 二分查找：二分法，查找result中比当前值大的最近arr元素对应的索引，用当前索引替换它
       */
      start = 0;
      end = result.length - 1;
      while (start < end) {
        middle = ((start + end) / 2) | 0; // |0 即向下取整
        if (arr[result[middle]] < arrI) {
          start = middle + 1;
        } else {
          end = middle;
        }
      }
      // 循环结束后，end 就是比当前 arrI 大的值，将result[end]替换成当前索引i
      if (arrI < arr[result[end]]) {
        p[i] = result[end - 1]; // 替换队列中较大值时，记录前面成员的索引
        result[end] = i;
      }
    }
  }

  // 追溯结果
  let i = result.length; // 获取最长递增子序列的长度
  let last = result[i - 1]; // 获取最后一项的索引
  while (i-- > 0) {
    result[i] = last; // 用最后一项的索引开始往前追溯
    last = p[last];
  }
  return result;
}
// let result = getSequence([2, 5, 8, 4, 6, 7, 9, 3]); // [ 0, 3, 4, 5, 6 ]
// console.log(result);

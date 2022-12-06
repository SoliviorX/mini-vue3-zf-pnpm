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
  const mountElement = (vnode, container) => {
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
    hostInsert(el, container);
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
    // TODO...
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
  const processElement = (n1, n2, container) => {
    if (n1 == null) {
      // 初次渲染
      mountElement(n2, container);
    } else {
      // diff 算法
      patchElement(n1, n2);
    }
  };

  // 初次渲染或更新vnode
  const patch = (n1, n2, container) => {
    if (n1 == n2) {
      return;
    }
    // 如果n1、n2都有值，但不是sameVNode，则删除n1，渲染n2
    if (n1 && !isSameVNode(n1, n2)) {
      unmount(n1);
      n1 = null; // 在 processElement 中会判定，当n1为null时，直接渲染n2
    }
    processElement(n1, n2, container);
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

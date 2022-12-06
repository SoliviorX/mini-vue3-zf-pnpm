import { nodeOps } from "./nodeOps";
import { patchProp } from "./patchProp";
import { createRenderer } from "@vue/runtime-core";

const renderOptions = Object.assign(nodeOps, { patchProp });
// runtime-dom 导出的 render 的本质还是调用 createRenderer，并传入runtime-dom中的renderOptions
export const render = (vnode, container) => {
  return createRenderer(renderOptions).render(vnode, container);
};

export * from "@vue/runtime-core";

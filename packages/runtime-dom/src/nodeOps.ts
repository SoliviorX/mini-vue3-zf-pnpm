/**
 * 元素、文本的增删改查
 */
export const nodeOps = {
  // 1. 创建元素
  createElement(tagName) {
    return document.createElement(tagName);
  },
  // 2. 插入元素
  insert(child, parent, anchor) {
    // 元素移动；
    // 当第二个参数为null时，插入到末尾；
    parent.insertBefore(child, anchor || null);
  },
  // 3. 移除元素
  remove(child) {
    const parent = child.parentNode;
    if (parent) {
      parent.removeChild(child);
    }
  },
  // 4. 查询元素
  querySelector(selector) {
    return document.querySelector(selector);
  },
  parentNode(node) {
    return node.parentNode;
  },
  nextSibling(node) {
    return node.nextSibling;
  },
  // 创建文本节点
  createText(text) {
    return document.createTextNode(text);
  },
  // 5. 设置文本
  setElementText(el, text) {
    el.textContent = text;
  },
  setText(node, text) {
    node.nodeValue = text;
  },
};

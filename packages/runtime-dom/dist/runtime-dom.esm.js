// packages/runtime-dom/src/nodeOps.ts
var nodeOps = {
  createElement(tagName) {
    return document.createElement(tagName);
  },
  insert(child, parent, anchor) {
    parent.insertBefore(child, anchor || null);
  },
  remove(child) {
    const parent = child.parentNode;
    if (parent) {
      parent.removeChild(child);
    }
  },
  querySelector(selector) {
    return document.querySelector(selector);
  },
  parentNode(node) {
    return node.parentNode;
  },
  nextSibling(node) {
    return node.nextSibling;
  },
  createText(text) {
    return document.createTextNode(text);
  },
  setElementText(el, text) {
    el.textContent = text;
  },
  setText(node, text) {
    node.nodeValue = text;
  }
};

// packages/runtime-dom/src/modules/attr.ts
var patchAttr = (el, key, value) => {
  if (value == null) {
    el.removeAttribute(key);
  } else {
    el.setAttribute(key, value);
  }
};

// packages/runtime-dom/src/modules/class.ts
var patchClass = (el, value) => {
  if (value == null) {
    el.removeAttribute("class");
  } else {
    el.className = value;
  }
};

// packages/runtime-dom/src/modules/event.ts
function createInvoker(initialValue) {
  const invoker = (e) => invoker.value(e);
  invoker.value = initialValue;
  return invoker;
}
var patchEvent = (el, key, nextValue) => {
  const invokers = el._vei || (el._vei = {});
  const name = key.slice(2).toLowerCase();
  const existingInvoker = invokers[name];
  if (nextValue && existingInvoker) {
    existingInvoker.value = nextValue;
  } else {
    if (nextValue) {
      const invoker = invokers[name] = createInvoker(nextValue);
      el.addEventListener(name, invoker);
    } else {
      el.removeEventListener(name, existingInvoker);
      invokers[name] = null;
    }
  }
};

// packages/runtime-dom/src/modules/style.ts
var patchStyle = (el, prev, next) => {
  const style = el.style;
  for (let key in next) {
    style[key] = next[key];
  }
  for (let key in prev) {
    if (next[key] == null) {
      style[key] = null;
    }
  }
};

// packages/runtime-dom/src/patchProp.ts
var patchProp = (el, key, prevValue, nextValue) => {
  if (key === "class") {
    patchClass(el, nextValue);
  } else if (key === "style") {
    patchStyle(el, prevValue, nextValue);
  } else if (/^on[^a-z]/.test(key)) {
    patchEvent(el, key, nextValue);
  } else {
    patchAttr(el, key, nextValue);
  }
};

// packages/runtime-dom/src/index.ts
var renderOptions = Object.assign(nodeOps, { patchProp });
console.log(renderOptions);
//# sourceMappingURL=runtime-dom.esm.js.map

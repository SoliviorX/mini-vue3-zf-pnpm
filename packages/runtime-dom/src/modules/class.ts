export const patchClass = (el, value) => {
  if (value == null) {
    el.removeAttribute("class");
  } else {
    el.className = value;
  }
};

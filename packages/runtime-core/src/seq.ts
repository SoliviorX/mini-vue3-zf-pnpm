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
let result = getSequence([2, 5, 8, 4, 6, 7, 9, 3]);
console.log(result);

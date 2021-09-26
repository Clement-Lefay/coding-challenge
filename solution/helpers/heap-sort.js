// Have to update the heapSort algo in order to be reused multiple times
//Source:https://bit.ly/3hEZdCl
/**
 * Based on HeapSort and adapted to manipulate object that has a "date" key
 * @param {array<Object>} arr
 * @returns sortedArray
 */
const heapSortByDate = (arr) => {
  const a = [...arr];
  let arrLength = a.length;

  const heapify = (a, i) => {
    const left = 2 * i + 1;
    const right = 2 * i + 2;
    let max = i;
    const leftDate = a[left] ? a[left].date : undefined;
    const rightDate = a[right] ? a[right].date : undefined;
    // Adapte to handle the date key
    if (left < arrLength && leftDate > a[max].date) {
      max = left;
    }
    // adapte to handle the date key
    if (right < arrLength && rightDate > a[max].date) {
      max = right;
    }
    if (max !== i) {
      [a[max], a[i]] = [a[i], a[max]];
      heapify(a, max);
    }
  };

  for (let i = Math.floor(arrLength / 2); i >= 0; i -= 1) {
    heapify(a, i);
  }

  for (let j = a.length - 1; j > 0; j--) {
    [a[0], a[j]] = [a[j], a[0]];
    arrLength--;
    heapify(a, 0);
  }

  return a;
};

/**
 * Sort the given array in ascending order
 * @param {array} arr
 * @returns sortedArray
 */
const heapSort = (arr) => {
  const a = [...arr];
  let arrLength = a.length;

  const heapify = (a, i) => {
    const left = 2 * i + 1;
    const right = 2 * i + 2;
    let max = i;
    if (left < arrLength && a[left] > a[max]) {
      max = left;
    }
    if (right < arrLength && a[right] > a[max]) {
      max = right;
    }
    if (max !== i) {
      [a[max], a[i]] = [a[i], a[max]];
      heapify(a, max);
    }
  };

  for (let i = Math.floor(arrLength / 2); i >= 0; i -= 1) {
    heapify(a, i);
  }

  for (let j = a.length - 1; j > 0; j--) {
    [a[0], a[j]] = [a[j], a[0]];
    arrLength--;
    heapify(a, 0);
  }

  return a;
};

module.exports = {
  heapSort,
  heapSortByDate,
};

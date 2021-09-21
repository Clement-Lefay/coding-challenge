"use strict";

// Heap Sort Algo - originaly fom (https://www.educba.com/sorting-algorithms-in-javascript/)
let arrLength;
function heapRoot(items, i, mirrorItems) {
  const left = 2 * i + 1;
  const right = 2 * i + 2;
  let max = i;
  if (left < arrLength && items[left] > items[max]) {
    max = left;
  }
  if (right < arrLength && items[right] > items[max]) {
    max = right;
  }
  if (max != i) {
    swap(items, i, max);
    swap(mirrorItems, i, max);
    heapRoot(items, max, mirrorItems);
  }
}

function swap(items, index_A, index_B) {
  var temp = items[index_A];
  items[index_A] = items[index_B];
  items[index_B] = temp;
}

function heapSortAlgo(items, mirrorItems) {
  // console.log("- heap sort start");
  arrLength = items.length;
  for (let i = Math.floor(arrLength / 2); i >= 0; i -= 1) {
    heapRoot(items, i, mirrorItems);
  }

  for (let j = items.length - 1; j > 0; j--) {
    swap(items, 0, j);
    swap(mirrorItems, 0, j);
    arrLength--;
    heapRoot(items, 0, mirrorItems);
  }
  // console.log("- Heap sort done!");
}

// Print all entries, across all of the sources, in chronological order.

module.exports = (logSources, printer) => {
  /**
   * we have logsources, a list of logSource
   * 1 logsource can have a lot of logs
   * 1 log have 1 msg and 1 date
   */

  /**
   * for each logSources
   *  call the pop()
   *  push the date in dateList (convert to getTime())
   *  push de message in msgList
   * Like this, both date and message will share the same index
   *
   * Once we have these 2 lists, we are sorting the dateList using the Heap Sort Algo
   *  when the index of the dateList will be swaped, the index of msgList will also be swaped
   *
   * For each date, print the result
   */
  if (!logSources) {
    return console.log("Please provide a real list of source, this one is empty!");
  }

  const dateList = [];
  const msgList = [];

  // extract all logs per LogSource
  for (let logSourceIndex = 0; logSourceIndex < logSources.length; logSourceIndex++) {
    let log = undefined;
    while ((log = logSources[logSourceIndex].pop())) {
      // Turn the date into number for easier storage and comparison between date later on
      dateList.push(log.date.getTime());
      msgList.push(log.msg);
    }
  }

  // Sort the datetime chronologycaly
  heapSortAlgo(dateList, msgList);

  // Print each log with the matching
  for (let dateIndex = 0; dateIndex < dateList.length; dateIndex++) {
    // Need to cast the value in the dateList to a proper Date format
    printer.print({
      date: new Date(dateList[dateIndex]),
      msg: msgList[dateIndex],
    });
  }

  printer.done();
  /**
   * Remarks
   * It appears this algo cannot handled the "100000" logSources due to lack of memory and the heapSort was not even started
   * One way to improve would be to push the log object diretly, instad of splitting it up in 2
   */
  return console.log("Sync sort complete.");
};

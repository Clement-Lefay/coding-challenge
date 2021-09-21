"use strict";

// Heap Sort Algo - originaly fom (https://www.educba.com/sorting-algorithms-in-javascript/)
let arrLength;
function heapRoot(items, i) {
  const left = 2 * i + 1;
  const right = 2 * i + 2;
  let max = i;
  // adapte the condition to match the date as comparator
  if (left < arrLength && items[left].date > items[max].date) {
    max = left;
  }
  // adapte the condition to match the date as comparator
  if (right < arrLength && items[right].date > items[max].date) {
    max = right;
  }
  if (max != i) {
    swap(items, i, max);
    heapRoot(items, max);
  }
}

function swap(items, index_A, index_B) {
  var temp = items[index_A];
  items[index_A] = items[index_B];
  items[index_B] = temp;
}

function heapSortAlgo(items) {
  arrLength = items.length;
  for (let i = Math.floor(arrLength / 2); i >= 0; i -= 1) {
    heapRoot(items, i);
  }

  for (let j = items.length - 1; j > 0; j--) {
    swap(items, 0, j);
    arrLength--;
    heapRoot(items, 0);
  }
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
   *  push the log into logList (and cast the date into number with getTime())
   *
   * Once we have this list, we are sorting the logList using the Heap Sort Algo
   *
   * For each date, print the result
   */
  if (!logSources) {
    return console.log("Please provide a real list of source, this one is empty!");
  }

  const logList = [];

  // extract all logs per LogSource
  for (let logSourceIndex = 0; logSourceIndex < logSources.length; logSourceIndex++) {
    let log = undefined;
    while ((log = logSources[logSourceIndex].pop())) {
      // Turn the date into number for easier storage and comparison between date later on
      logList.push({
        date: log.date.getTime(),
        msg: log.msg,
      });
    }
  }

  // Sort the datetime chronologycaly
  heapSortAlgo(logList);

  // Print each log with the matching
  for (let dateIndex = 0; dateIndex < logList.length; dateIndex++) {
    // Need to cast the value in the logList to a proper Date format
    printer.print({
      date: new Date(logList[dateIndex].date),
      msg: logList[dateIndex].msg,
    });
  }

  printer.done();
  /**
   * Remarks
   * It appears this algo cannot do more than "40 000" logSources due to lack of memory and the heapSort was not even started
   * here are one of the best result I have with 40 000:
      drain_log_sync: 11606.216ms
      heap_sort_sync: 64032.961ms
      print_sync: 9980.965ms

      ***********************************
      Logs printed:            9579268
      Time taken (s):          9.981
      Logs/s:                  959750.3256186754
      ***********************************

   */
  return console.log("Sync sort complete.");
};

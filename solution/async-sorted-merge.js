"use strict";

const P = require("bluebird");

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
  // console.log("- heap sort start");
  arrLength = items.length;
  for (let i = Math.floor(arrLength / 2); i >= 0; i -= 1) {
    heapRoot(items, i);
  }

  for (let j = items.length - 1; j > 0; j--) {
    swap(items, 0, j);
    arrLength--;
    heapRoot(items, 0);
  }
  // console.log("- Heap sort done!");
}

// Print all entries, across all of the *async* sources, in chronological order.

module.exports = (logSources, printer) => {
  return new Promise(async (resolve, reject) => {
    let logList = [];

    const drainSourceLog = async (logSource) => {
      const log = await logSource.popAsync();
      if (log) {
        // directly update the logList
        logList.push({
          date: log.date.getTime(),
          msg: log.msg,
        });
        // look for the next log
        return await drainSourceLog(logSource);
      } else {
        return log;
      }
    };

    /**
     * With popAsync, we can maybe have multiple sources calling popAsync concurently
     *
     * so the idea is the same as before
     *  extract all logs, concurrently is possible
     *    like for K amount, where K is te number of logSources
     *
     *  push the log into an array (no split between date and msg, we keep the object to try)
     *
     *  sort the array with Heap Sort
     *
     *  print them all!
     */

    if (!logSources) {
      resolve(console.log("Please provide a real list of source, this one is empty!"));
    }

    // get all logs
    console.time("drain_log_async");
    try {
      // Here we are loading each logSource into a promise that is stored in the concurrentPromises
      let concurrentPromises = [];
      for (let sourceIndex = 0; sourceIndex < logSources.length; sourceIndex++) {
        concurrentPromises.push(drainSourceLog(logSources[sourceIndex]));
      }
      // fire all stored promises in concurrency for a quick response
      // No need to worry about the logList, the drainSourceLog is taking care or updating it
      await P.map(concurrentPromises, () => {}, { concurrency: logSources.length });
    } catch (error) {
      console.error("Something went wrong :/ ", error);
      reject(error);
    }
    console.timeEnd("drain_log_async");

    console.time("heap_sort_async");
    // sort them chronologicaly
    heapSortAlgo(logList);
    console.timeEnd("heap_sort_async");

    console.time("print_async");
    // print
    for (let logIndex = 0; logIndex < logList.length; logIndex++) {
      printer.print({
        date: new Date(logList[logIndex].date),
        msg: logList[logIndex].msg,
      });
    }
    console.timeEnd("print_async");

    printer.done();
    /**
     * Remarks
     * the current implementation cannot pass more than "13 000" logSources due to lack of memory
     * here are the result of 1 run
        drain_log_async: 44530.759ms
        heap_sort_async: 13551.002ms
        print_async: 2288.748ms

        ***********************************
        Logs printed:            3115871
        Time taken (s):          2.288
        Logs/s:                  1361831.730769231
        ***********************************

     */
    resolve(console.log("Async sort complete."));
  });
};

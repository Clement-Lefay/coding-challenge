"use strict";

const P = require("bluebird");
const fs = require("fs").promises;

// Heap Sort Algo - originaly fom (https://www.educba.com/sorting-algorithms-in-javascript/)
let arrLength;
function heapRoot(items, i) {
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
    heapRoot(items, max);
  }
}

function swap(items, index_A, index_B) {
  var temp = items[index_A];
  items[index_A] = items[index_B];
  items[index_B] = temp;
}

function heapSortAlgo(items) {
  console.time("heap_sort_async");
  arrLength = items.length;
  for (let i = Math.floor(arrLength / 2); i >= 0; i -= 1) {
    heapRoot(items, i);
  }

  for (let j = items.length - 1; j > 0; j--) {
    swap(items, 0, j);
    arrLength--;
    heapRoot(items, 0);
  }
  console.timeEnd("heap_sort_async");
}

// Print all entries, across all of the *async* sources, in chronological order.

module.exports = (logSources, printer) => {
  return new Promise(async (resolve, reject) => {
    const tmpPath = "./tmp";

    const drainSourceLog = async (logSource) => {
      const log = await logSource.popAsync();
      if (log) {
        // Create a file with these informations
        await fs.writeFile(`${tmpPath}/${log.date.getTime()}.txt`, log.msg);
        // look for the next log
        return await drainSourceLog(logSource);
      } else {
        return log;
      }
    };

    /**
     * With popAsync, we can have multiple sources calling popAsync concurently
     *
     * so the idea is the same as before
     *  create a tmp folder
     *
     *  extract all logs, concurrently is possible, and create 1 file for each
     *    like for K amount, where K is te number of logSources
     *
     *  get the list of files
     *
     *  sort this list with Heap Sort
     *
     *  print them all!
     */

    if (!logSources) {
      resolve(console.log("Please provide a real list of source, this one is empty!"));
    }

    // create new directory
    try {
      await fs.mkdir(tmpPath);
      // first check if directory already exists
      console.log("Directory is created.");
    } catch (err) {
      console.log("Directory already exists.");
    }

    console.time("drain_log_async");
    // get all logs
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

    // read all files in the tmp folder
    const files = await fs.readdir(tmpPath);

    // sort them chronologicaly
    heapSortAlgo(files);

    // print
    for (let logIndex = 0; logIndex < files.length; logIndex++) {
      try {
        const data = await fs.readFile(`${tmpPath}/${files[logIndex]}`, "utf-8");
        // Need to cast the fileName from string to a number that the Date can convert
        printer.print({
          date: new Date(+files[logIndex].split(".")[0]),
          msg: data,
        });
      } catch (error) {
        console.error(error);
      }
    }

    // remove the directory
    await fs.rmdir(tmpPath, { recursive: true });
    console.log(`${tmpPath} is deleted!`);

    printer.done();
    resolve(console.log("Async sort complete."));

    /**
     * Remarks
     * Before applying the FS to this implementation, we were limited to 13 000 logSources.
     * With how slow it becomes, I have no idea how long it will take
     * 
     *  here are the previous result with 13000 (No FS)
        -        drain_log_async: 44530.759ms
        -        heap_sort_async: 13551.002ms
        -        print_async: 2288.748ms
        -
        -        ***********************************
        -        Logs printed:            3115871
        -        Time taken (s):          2.288
        -        Logs/s:                  1361831.730769231
        -        ***********************************

     */
  });
};

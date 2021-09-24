"use strict";

const fs = require("fs");

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
  console.time("heap_sort_sync");
  arrLength = items.length;
  for (let i = Math.floor(arrLength / 2); i >= 0; i -= 1) {
    heapRoot(items, i);
  }

  for (let j = items.length - 1; j > 0; j--) {
    swap(items, 0, j);
    arrLength--;
    heapRoot(items, 0);
  }
  console.timeEnd("heap_sort_sync");
}

// Print all entries, across all of the sources, in chronological order.

module.exports = (logSources, printer) => {
  /**
   * create a tmp folder
   *
   * go through each sources and create a new file for each source with the property:
   *  with the name = date in number format (date.getTime())
   *  content = the msg
   *
   * identify all the files sort them by aplying the Heap Sort with the fileName
   *
   * read all the files in this folder and apply the printer.print with the fileName and the content
   *
   * delete the tmp folder
   */

  if (!logSources) {
    return console.log("Please provide a real list of source, this one is empty!");
  }

  const tmpPath = "./tmp";
  // create new directory
  try {
    // first check if directory already exists
    if (!fs.existsSync(tmpPath)) {
      fs.mkdirSync(tmpPath);
      console.log("Directory is created.");
    } else {
      console.log("Directory already exists.");
    }
  } catch (err) {
    console.error(err);
  }

  console.time("drain_log_sync");
  // extract all logs per LogSource and create a file for each log, using the date as a fileName
  for (let logSourceIndex = 0; logSourceIndex < logSources.length; logSourceIndex++) {
    let log = undefined;
    while ((log = logSources[logSourceIndex].pop())) {
      // Turn the date into number for easier storage and comparison between date later on
      fs.writeFileSync(`${tmpPath}/${log.date.getTime()}.txt`, log.msg);
    }
  }
  console.timeEnd("drain_log_sync");

  // read all files in the tmp folder
  const files = fs.readdirSync(tmpPath);

  // Sort the datetime chronologycaly
  heapSortAlgo(files);

  // Print content of the all log files
  for (let dateIndex = 0; dateIndex < files.length; dateIndex++) {
    try {
      const data = fs.readFileSync(`${tmpPath}/${files[dateIndex]}`, "utf-8");
      // Need to cast the fileName from string to a number that the Date can convert
      printer.print({
        date: new Date(+files[dateIndex].split(".")[0]),
        msg: data,
      });
    } catch (error) {
      console.error(error);
    }
  }

  printer.done();

  // remove the directory
  fs.rmdirSync(tmpPath, { recursive: true });
  console.log(`${tmpPath} is deleted!`);

  return console.log("Sync sort complete.");
  /**
   * Remarks
   * Using the file system (write and read) make the process ultimately slow!
   * Even with just 10000....
   * Honeslty, I have no idea if this way is the most efficient, but at least the memory seems to be better with this one
   *
    * here are one of the best result I have with 40 000 (no FS):
      -      drain_log_sync: 11606.216ms
      -      heap_sort_sync: 64032.961ms
      -      print_sync: 9980.965ms
      -
      -      ***********************************
      -      Logs printed:            9579268
      -      Time taken (s):          9.981
      -      Logs/s:                  959750.3256186754
      -      ***********************************

      -  

   */
};

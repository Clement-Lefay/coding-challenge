"use strict";

const P = require("bluebird");
const fs = require("fs").promises;
const { heapSort, heapSortByDate } = require("./helpers/heap-sort");

// Print all entries, across all of the *async* sources, in chronological order.

module.exports = (logSources, printer) => {
  return new Promise(async (resolve, reject) => {
    const tmpPath = "./tmp";

    const drainSourceLog = async (logSource) => {
      const log = await logSource.popAsync();
      if (log) {
        // create the filename with the date in this format YYYY-MM-DD and remove the time from it
        const fileDateFormatName = new Date(log.date).toJSON().split("T")[0];
        const filePath = `${tmpPath}/${fileDateFormatName}.txt`;
        // create a modified duplicate of the log, due to date change to ms instead of plain Date object
        const modifiedLog = {
          date: log.date.getTime(),
          msg: log.msg,
        };
        // Check if the file already exist so we can update it if we can
        try {
          await fs.access(filePath);
          await fs.appendFile(filePath, JSON.stringify(modifiedLog) + ",");
          // look for the next log
          return await drainSourceLog(logSource);
        } catch (e) {
          // The file doesn't exist if it fails
          // Create the file with this special name
          // we serialize the content so the size would be smaller than storing the object and add the opening bracket and , in order to cumulate them
          try {
            // The flag "a" make sure it would write at the end of the file
            await fs.writeFile(filePath, JSON.stringify(modifiedLog) + ",", { flag: "a" });

            // look for the next log
            return await drainSourceLog(logSource);
          } catch (error) {
            console.error(error);
          }
        }
      } else {
        return log;
      }
    };

    /**
     * With popAsync, we can have multiple sources calling popAsync concurently
     *
     * Update with the idea from sync
     *  create a tmp folder
     *
     *  extract all logs, concurrently is possible apparently,
     *    create or update the file where the fileName will have the same date (format YYYYMMDD)
     *
     *  get the list of files
     *
     *  sort this list with Heap Sort
     *
     *  for each file
     *  - update the content with close braket and remove last coma
     *  - the content should be parsed and create an array
     *  - sorting this array
     *  - print them one by one
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
        // await drainSourceLog(logSources[sourceIndex]);
        // concurrently
        concurrentPromises.push(drainSourceLog(logSources[sourceIndex]));
      }
      // fire all stored promises an run them concurrently for a quick response
      // No need to worry about the creating or updating files, the drainSourceLog is taking care of it
      await P.map(concurrentPromises, () => {}, { concurrency: 10 });
    } catch (error) {
      console.error("Something went wrong :/ ", error);
      reject(error);
    }
    console.timeEnd("drain_log_async");

    // read all files in the tmp folder
    let files = await fs.readdir(tmpPath);

    console.time("heapsort_files_async");
    // sort them chronologicaly
    files = heapSort(files);
    console.timeEnd("heapsort_files_async");

    // Print all logs for each date
    for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
      try {
        let data = await fs.readFile(`${tmpPath}/${files[fileIndex]}`, "utf-8");

        // remove the last coma and add the closing bracket before parsing
        data = "[" + data.slice(0, -1) + "]";
        let parsedData = JSON.parse(data);

        // sort all logs of this date chronologically
        parsedData = heapSortByDate(parsedData);

        // print all logs until we cleared this file
        while (parsedData.length > 0) {
          const log = parsedData[0];
          // Need to cast the fileName from string to a number that the Date can convert
          printer.print({
            date: new Date(+log.date),
            msg: log.msg,
          });

          // Remove the first log from this list
          parsedData.splice(0, 1);
        }
      } catch (error) {
        console.error(error);
      }
    }

    printer.done();

    // remove the directory
    await fs.rmdir(tmpPath, { recursive: true });
    console.log(`${tmpPath} is deleted!`);

    resolve(console.log("Async sort complete."));

    /**
     * Remarks
     * This implementation has too much writing at the same time and can reach 5 000 logSources.
     * At 10 000 logSources, the process failed because too many files are written at the same time
     * 
     * One way to improve it
     *  idea 1
     *    in the drainSourceLog(), create an object that wil contains a key/value pair with
     *    {
     *      [date in format YYYYMMDD] : [list of logs on this date]
     *    }
     *    create a file with the key name and write the content inside
     *  The line 94 with ( await P.map(concurrentPromises, () => {}, { concurrency: 10 });) will not be used anymore
     *
     *  Idea 2
     *    in the drainSourceLog(), if log !== false
     *      YES => add the log in an array and call drainSourceLog() with the array
     *      NO  => read all logs in the array and write them, concurrently maybe
     *  The line 94 with ( await P.map(concurrentPromises, () => {}, { concurrency: 10 });) will not be used anymore
     *
     * Performance tests:
     * With the FS implementation with 5 000 logSources
        drain_log_async: 151894.300ms
        heapsort_files_async: 0.671ms

        ***********************************
        Logs printed:            1198510
        Time taken (s):          44.845
        Logs/s:                  26725.610435946037
        ***********************************
     *
     *  here is one of the result with 13 000 logSources (No FS)
          drain_log_async: 44530.759ms
          heap_sort_async: 13551.002ms
          print_async: 2288.748ms

          ***********************************
          Logs printed:            3115871
          Time taken (s):          2.288
          Logs/s:                  1361831.730769231
          ***********************************
     */
  });
};

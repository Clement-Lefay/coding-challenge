"use strict";

const P = require("bluebird");
const fs = require("fs").promises;
const { heapSort, heapSortByDate } = require("./helpers/heap-sort");

// Print all entries, across all of the *async* sources, in chronological order.

module.exports = (logSources, printer) => {
  return new Promise(async (resolve, reject) => {
    const tmpPath = "./tmp";

    /**
     * Go through the logSource until it is totally drained and return a logs object, with each key is a date and the value are a list of logs of this date
     * The average time to drain an entire source is around 4s and cannot be reduced (15ms for each popAsync() * 250 logs in average = 3750ms)
     * @param {Object} logSource
     * @param {Object} logs
     * @returns [log]
     */
    const drainSourceLog = async (logSource, logs = {}) => {
      const log = await logSource.popAsync(); // average time of processe = 15.00ms
      if (log) {
        // create the key to store on this format - YYYY-MMM-DD
        const dateKey = log.date.toJSON().split("T")[0];
        // cast the date into number for easier storage
        const modifiedLog = {
          date: log.date.getTime(),
          msg: log.msg,
        };
        // check if it exist in the logs object following this format {dateKey: [log, log, log,...]}
        if (!logs[dateKey]) {
          // Add the entry with the value = [log]
          logs[dateKey] = [modifiedLog];
        } else {
          // insert the modifiedLog into the array list
          logs[dateKey] = [...logs[dateKey], modifiedLog];
        }
        // call the next drainSourceLog and pass this object
        return await drainSourceLog(logSource, logs);
      } else {
        // we drained everything from this source, so we can return all the logs we found
        // Get all promises together of this source, for a parallele execution later
        let concurrentPromises = [];
        // for each dateKey, add the writeLog promise to the list
        for (const log in logs) {
          const filePath = `${tmpPath}/${log}.txt`;
          concurrentPromises.push(writeLogToFile(filePath, logs[log]));
        }
        // we can fire up to 1000 promises concurrently since they will not touch the same file.
        // 1000 is a safe value since NodeJs restrits to 1024 open file at the same time
        await P.map(concurrentPromises, () => {}, { concurrency: 1000 });
        return logs;
      }
    };

    /**
     *  write into the existing or new file with fileName the log
     * @param {Object} fileName
     * @param {Object} log
     * @returns Promise<void>
     */
    const writeLogToFile = (fileName, log) => {
      return new Promise(async (resolve, reject) => {
        try {
          //  stringify the value of this dateKey, remove the opening and closing bracket around the log and add a coma for easier addition later on
          // We could use replace() but it may corrupt the content of the log
          const fileContent = JSON.stringify(log).substring(1).slice(0, -1) + ",";
          await fs.access(fileName);
          await fs.appendFile(fileName, fileContent);
          resolve();
        } catch (e) {
          // The file doesn't exist if it fails
          // Create the file with this special name
          try {
            //  stringify the value of this dateKey, remove the closing bracket adn the end and add a coma for easier addition later on
            // We could use replace() but it may corrupt the content of the log
            const fileContent = JSON.stringify(log).slice(0, -1) + ",";
            await fs.writeFile(fileName, fileContent);
            resolve();
          } catch (error) {
            reject(error);
          }
        }
      });
    };

    /**
     * With popAsync, we can have multiple sources calling popAsync concurently
     *
     * Update with the idea from sync
     *  create a tmp folder
     *
     *  extract all logs, concurrently is possible apparently,
     *    create or update the file where the fileName will have the same date (format YYYY-MM-DD)
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
      for (let sourceIndex = 0; sourceIndex < logSources.length; sourceIndex++) {
        process.stdout.write(` Processing source n°${sourceIndex + 1}/${logSources.length} \r`);
        await drainSourceLog(logSources[sourceIndex]);
      }
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
        data = data.slice(0, -1) + "]";
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
     * This implementation take at most 4s per sources (in average) and cannot be reduced due to how the popAsync() works.
     * To match the same amount of logSources the sync solution could process (50000), it takes much more time to see the end, more than 2 hours.
     * The actual solution could be improve but my investigations on running at the same time multiple drainSourceLog() doesn't reduce the time to process
     *  Splitting into more files would reduce the size of all files when a lot of logSources are provided
     *    in the case where the file is big (more than 100MB maybe?), we could use a library like, 'stream-json', to read files as streams
     *
     * One way to improve is to use a database instead of writing on the disk of the computer/server.
     *  We could save more data at the same time and have more servers/worker running at the same time to process all the logSources
     *
     * Performance tests (with the console.log() from the printer commented):
     * 
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

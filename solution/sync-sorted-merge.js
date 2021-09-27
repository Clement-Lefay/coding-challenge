"use strict";

const fs = require("fs");
const { heapSortByDate, heapSort } = require("./helpers/heap-sort");

// Print all entries, across all of the sources, in chronological order.

module.exports = (logSources, printer) => {
  /**
   * create a tmp folder
   *
   * 1 extract all logs and save them outside of the memory
   *
   *
   * Idea 1
   *  for each source
   *    write in a file the JSON.stringify() of the "{date, msg},", until the file is 100 MB large,
   *    create another file to continue to store these value
   *  Reflexion: Will cause issue to sort all logs chronologically
   *
   * Idea 2
   *  for each source
   *    each log would create/update a file who will have the name in YYYYMM format,
   *    and will store the stringify() result of "{date, msg},"
   *    The maximum size of each file can be set to 500 MB before we create a YYYYMM_2 file
   *  Reflexion: Should be enough for a decent amount of logSources but I'm worried of sorting them
   *
   * Idea 3
   *  for each source
   *    each log would create/update a file who will have a name in  YYYY-MM-DD (originialy was YYYYMMDD_HHMMSS),
   *    this format will make it easier to controle the size of the file and do a pre sort
   *    The content of the log will be stringify() (include a coma at the end for limitation)
   *  Reflexion: seems to be a good balance of sorting and dispatching data
   *
   * Idea 4
   *  for each source
   *    each new date will create a folder depending on
   *    year/month/date/hour/minute/seconde
   *    And store the data in a unique file
   *  Reflexion: a more human friendly way to organiwe logs but it will not be efficient, too many folder and files to create
   *
   * Idea 5
   *  for each source
   *    create a file where we will be writing all logs in a stream
   *  Reflexion: Could be simple for small amount but for big quantity, the file will be too big and would need to be split
   *
   * Idea 6 (same as Idea 3 by using writeStream)
   *  Reflexion: could be another way to improve the writing speed but we have to track all open stream to close them (not sure node close them automatically)
   *
   *
   * 2 sort them
   *  Depending of the solution, when the sort will be applied is different
   *
   * 3 print them in chronological order
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

  // Apply the idea 3
  console.time("drain_log_sync");
  // Extract all logs and store them on the disk depending on there date
  for (let logSourceIndex = 0; logSourceIndex < logSources.length; logSourceIndex++) {
    process.stdout.write(` Processing source n°${logSourceIndex + 1}/${logSources.length} \r`);
    let log = undefined;
    // drain all logs per LogSource until there is none
    while ((log = logSources[logSourceIndex].pop())) {
      // create the filename with the date in this format YYYY-MM-DD and remove the time from it
      const fileDateFormatName = log.date.toJSON().split("T")[0];
      const filePath = `${tmpPath}/${fileDateFormatName}.txt`;
      // create a modified duplicate of the log, due to date change to ms instead of plain Date object
      const modifiedLog = {
        date: log.date.getTime(),
        msg: log.msg,
      };
      // Check if the file already exist so we can update it if we can
      try {
        fs.accessSync(filePath);
        fs.appendFileSync(filePath, JSON.stringify(modifiedLog) + ",");
      } catch (e) {
        // The file doesn't exist if it fails
        // Create the file with this special name
        // we serialize the content so the size would be smaller than storing the object and add the opening bracket and , in order to cumulate them
        fs.writeFileSync(filePath, "[" + JSON.stringify(modifiedLog) + ",");
      }
    }
  }
  console.timeEnd("drain_log_sync");

  // get the list of all files in the tmp folder
  let files = fs.readdirSync(tmpPath);
  console.time("heapsort_files_sync");
  // Sort this list chronologycaly
  files = heapSort(files);
  console.timeEnd("heapsort_files_sync");

  /**
   *  on each file:
   *  - update the content with close braket and remove last coma
   *  - the content should be parsed and create an array
   *  - sorting this array
   *  - print them one by one
   *
   * */
  for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
    try {
      let data = fs.readFileSync(`${tmpPath}/${files[fileIndex]}`, "utf-8");

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
  fs.rmdirSync(tmpPath, { recursive: true });
  console.log(`${tmpPath} is deleted!`);

  return console.log("Sync sort complete.");
  /**
   * Remarks
   * Seems to be a good compromise between memory usage and execution time for this kind of process
   * One way to improve it (maybe), could be to change the fileName to the format YYYYMMDD_HHMMSS
   *  It gives a smaller amount of data per file but much more files to process too
   * Another way to improve
   *  store the data in a DB to remove the time spent to read and write files (that are longer than accessing a DataBase)
   *  and this dataBase can be in the cloud
   * More logSource will result in longer exeuction time if using 1 machine,
   *  So we could split the amount of logSource between multiple worker (on the cloud) and store them in a place accessible
   *  Better result if we have multiple workers, with specific task such as draining the sources or print the logs, and talking to a Database
   *
   * Performance test (with the console.log() from the printer commented):
   * - 50 000 (around 45min with FS)
   * 
      drain_log_sync: 2341560.448ms
      heapsort_files_sync: 0.349ms

      ***********************************
      Logs printed:            11980514
      Time taken (s):          3956.399
      Logs/s:                  3028.13593876654
      ***********************************

      as a reminder, here is a result with the highest amount of logSource (40000) without the File System
      - 40 000 (no FS):

      drain_log_sync: 11606.216ms
      heap_sort_sync: 64032.961ms
      print_sync: 9980.965ms

      ***********************************
      Logs printed:            9579268
      Time taken (s):          9.981
      Logs/s:                  959750.3256186754
      ***********************************
   *
   */
};

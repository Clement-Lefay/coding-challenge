"use strict";

// Print all entries, across all of the sources, in chronological order.

module.exports = (logSources, printer) => {
  /**
   * Observation on performance
   * The sort function can handled 1 000 000 sources and
   * the print function would be the slowest part (taking around 90% to 99.99% of execution time)
   *
   * The built-in Sort() looks like cannot process 10 000 000 or sources due to lack of allocated memory
   * The sort() has to be improved to handled heavy loads
   */
  // console.time("sort");
  const sortedLogSource = logSources.sort((a, b) => a.last.date - b.last.date);
  // console.timeEnd("sort");

  // console.time("print");
  for (let i = 0; i < sortedLogSource.length; i++) {
    const log = sortedLogSource[i];
    printer.print(log.last);
  }
  // console.timeEnd("print");

  printer.done();
  return console.log("Sync sort complete.");
};

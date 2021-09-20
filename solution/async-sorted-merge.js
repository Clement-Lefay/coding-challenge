"use strict";

// Print all entries, across all of the *async* sources, in chronological order.

module.exports = (logSources, printer) => {
  return new Promise(async (resolve, reject) => {
    // for each logSources
    // * pop the source until it is depleted (return false)
    // * add the date to the object, as a key, and push the msg into the value, that is an array
    const logMap = {};

    for (let i = 0; i < logSources.length; i++) {
      const logSource = logSources[i];
      let logSourceNotDrained = true;

      while (logSourceNotDrained === true) {
        // pop the source
        const entry = logSource.pop();
        // Well, the popAsync never return anything and just keeps looping infinitely
        // const entry = await logSource.popAsync();
        // check if the logSource is ended or not
        if (entry !== false) {
          const rawDate = entry.date.toJSON();
          const date = rawDate.split("T")[0];
          const dateTime = entry.date.getTime();
          // check if new date to save
          if (!logMap[date]) {
            logMap[date] = {
              [dateTime]: entry.msg,
            };
          } else {
            logMap[date][dateTime] = entry.msg;
          }
        } else {
          // there is no more entry, stop the loop
          logSourceNotDrained = false;
        }
      }
    }

    // sort by key (= date) and turn it to an array
    const sortedDateLogMap = Object.entries(logMap).sort(([dateA, dateTimesA], [dateB, dateTimesB]) => new Date(dateA) - new Date(dateB));

    // for each date, sort by time, rebuild an object that the print function can manipulate
    for (let j = 0; j < sortedDateLogMap.length; j++) {
      const currentDate = sortedDateLogMap[j][0];
      const sortedTimeLog = Object.entries(sortedDateLogMap[j][1]).sort(([timeA, msgA], [timeB, msgB]) => new Date(+timeA) - new Date(+timeB));

      for (let k = 0; k < sortedTimeLog.length; k++) {
        const entryLog = {
          date: new Date(+sortedTimeLog[k][0]),
          msg: sortedTimeLog[k][1],
        };
        printer.print(entryLog);
      }
    }

    printer.done();
    resolve(console.log("Async sort complete."));
  });
};

"use strict";

// Print all entries, across all of the sources, in chronological order.

module.exports = (logSources, printer) => {
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
          // // check if there is already something at this time
          // if (!logMap[date][dateTime]) {
          // logMap[date][dateTime] = [entry.msg];
          // }
          // Would handled the case where different logs are generated at the same time
          //  else {
          //   // same day and same time, we add the message
          //   logMap[date][dateTime] = [...logMap[date][dateTime], entry.msg];
          // }
        }
      } else {
        // there is no more entry, stop the loop
        logSourceNotDrained = false;
      }
    }
  }
  // console.log(logMap);

  // sort by key (= date) and turn it to an array
  const sortedDateLogMap = Object.entries(logMap).sort(([dateA, dateTimesA], [dateB, dateTimesB]) => new Date(dateA) - new Date(dateB));

  // console.log(sortedDateLogMap);

  // for each date, sort by time, rebuild an object that the print function can manipulate
  for (let j = 0; j < sortedDateLogMap.length; j++) {
    // console.log(sortedDateLogMap[j][1]);
    const currentDate = sortedDateLogMap[j][0];
    const sortedTimeLog = Object.entries(sortedDateLogMap[j][1]).sort(([timeA, msgA], [timeB, msgB]) => new Date(+timeA) - new Date(+timeB));
    // console.log(sortedTimeLog);
    // console.log(" ");

    for (let k = 0; k < sortedTimeLog.length; k++) {
      const entryLog = {
        date: new Date(+sortedTimeLog[k][0]),
        msg: sortedTimeLog[k][1],
      };
      printer.print(entryLog);
    }
  }

  printer.done();
  return console.log("Sync sort complete.");
};

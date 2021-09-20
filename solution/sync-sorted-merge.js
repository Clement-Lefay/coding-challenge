'use strict';

// Print all entries, across all of the sources, in chronological order.

module.exports = (logSources, printer) => {
  const sortedLogSource = logSources.sort((a, b) => a.last.date - b.last.date);

  for (let i = 0; i < sortedLogSource.length; i++) {
    const log = sortedLogSource[i];
    printer.print(log.last);
  }

  printer.done();
  return console.log('Sync sort complete.');
};

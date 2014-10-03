'use strict';

//
// Most of the output placeholders which are supported by the git command line's
// --format flag. Currently not including the table separators.
//
var formats = /^%(H|h|T|t|P|p|an|aN|ae|aE|ad|aD|ar|at|ai|cn|cN|ce|cE|cd|cD|cr|ct|ci|d|e|s|f|b|B|N|GG|G\?|GS|GK|gD|gd|gn|gN|ge|gE|gs|m|n|\%|x00)/;

/**
 * Parse the outputted lines to a JSON object.
 *
 * @param {String} line The outputted line.
 * @param {String} format Format that we used to output the line.
 * @returns {Object}
 * @api public
 */
function parser(line, format) {
  //
  // Start by cleaning up the output that could have been added by the `--graph`
  // command line flag. It prepends pointless `* ` in front of the returned
  // lines.
  //
  line = line.replace(/^\*\s+/, '');

  var op
    , data = {}
    , lineindex = 0
    , formatindex = 0;

  while (formatindex !== format.length) {
    if (
       format.charAt(formatindex) !== '%'
    || !(op = formats.exec(format.slice(formatindex)))
    ) {
      lineindex++;
      formatindex++;
      continue;
    }

    formatindex += op[0].length;
    switch (op[1]) {
      //
      // Switch statement magic. The first parts of the switch statements
      // deliberately fall through as they only do parsing for common formats in
      // order to reduce the amount of duplicate code required for this.
      //
      case 'H': case 'P': case 'T':  // Full hash parsing
        op = line.substr(lineindex, 40);
        lineindex += 40;

      case 'h': case 'p': case 't': // Abbrv hash parsing
        op = line.substr(lineindex, 7);
        lineindex += 7;

      case 'at': case 'ct': // Unix timestamps
        op = /(\d+)/.exec(line.substr(lineindex));
        lineindex += op[0].length;
        op[1] = +op[1];

      case 'ar': case 'cr': // Relative date
        op = /^(\d+\s\w+\sago)/.exec(line.substr(lineindex));
        lineindex += op[0].length;

      case 'aD': case 'cD': // RFC date parsing.
        op = /^(\w{3}\,\s\d+\s\w{3}\s\d{4}\s\d{2}\:\d{2}\:\d{2}\s[+-]\d{4})/g.exec(line.substr(lineindex));
        lineindex += op[0].length;

      case 'ai': case 'ci': // ISO date parsing.
        op = /(\d{4}-\d{2}\-\d{2}\s\d{2}\:\d{2}\:\d{2}\s[+-]\d{4})/.exec(line.substr(lineindex));
        lineindex += op[0].length;

      case 'h': data.abbrevcommithash = op; break;
      case 'p': data.abbrevparenthash = op; break;
      case 't': data.abbrevtreehash = op;   break;
      case 'H': data.commithash = op; break;
      case 'P': data.parenthash = op; break;
      case 'T': data.treehash = op;   break;
      case 'at': data.authored = data.authored || {}; data.authored.unix = op[1]; break;
      case 'ct': data.commited = data.commited || {}; data.commited.unix = op[1]; break;
      case 'ar': data.authored = data.authored || {}; data.authored.ago = op[1]; break;
      case 'cr': data.commited = data.commited || {}; data.comimted.ago = op[1]; break;
      case 'aD': data.authored = data.authored || {}; data.authored.rfc = op[1]; break;
      case 'cD': data.commited = data.commited || {}; data.commited.rfc = op[1]; break;
      case 'ai': data.authored = data.authored || {}; data.authored.iso = op[1]; break;
      case 'ci': data.commited = data.commited || {}; data.commited.iso = op[1]; break;
    }
  }

  return data;
}

//
// Expose the module
//
module.exports = parser;

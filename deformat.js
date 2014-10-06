'use strict';

//
// Most of the output placeholders which are supported by the git command line's
// --format flag. Currently not including the table separators.
//
var placeholders = 'H|h|T|t|P|p|an|aN|ae|aE|ad|aD|ar|at|ai|cn|cN|ce|cE|cd|cD|cr|ct|ci|d|e|s|f|b|B|N|GG|G\\?|GS|GK|gD|gd|gn|gN|ge|gE|gs|m|n|\\%|x00'
  , reformat = new RegExp('(%('+ placeholders +'))', 'g')
  , formats = new RegExp('^%('+ placeholders +')');

//
// Create a separator which we will use to container the placeholders.
//
var separator = '\ufffdgit-shizzle\ufffd';

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
    , result
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

    //
    // Pre-parse the formats as certain formats share the same data formatting
    // so this allows us to remove a lot of duplicate code and just have
    // a separation of parsing and data assignment.
    //
    switch (op[1]) {
      case 'H': case 'P': case 'T':  // Full hash parsing.
        result = line.substr(lineindex, 40);
        lineindex += 40;
      break;

      case 'h': case 'p': case 't': // Abbrv hash parsing.
        result = line.substr(lineindex, 7);
        lineindex += 7;
      break;

      case 'at': case 'ct': // Unix timestamps.
        result = /(\d+)/.exec(line.substr(lineindex));
        lineindex += result[0].length;
        result[1] = +result[1];
      break;

      case 'ar': case 'cr': // Relative date.
        result = /^(\d+\s\w+\sago)/.exec(line.substr(lineindex));
        lineindex += result[0].length;
      break;

      case 'aD': case 'cD': // RFC date parsing.
        result = /^(\w{3}\,\s\d+\s\w{3}\s\d{4}\s\d{2}\:\d{2}\:\d{2}\s[+-]\d{4})/g.exec(line.substr(lineindex));
        lineindex += result[0].length;
      break;

      case 'ai': case 'ci': // ISO date parsing.
        result = /(\d{4}-\d{2}\-\d{2}\s\d{2}\:\d{2}\:\d{2}\s[+-]\d{4})/.exec(line.substr(lineindex));
        lineindex += result[0].length;
      break;
    }

    //
    // Assign all the parse results on the data object.
    //
    switch (op[1]) {
      case 'h': data.abbrevcommithash = result; break;
      case 'p': data.abbrevparenthash = result; break;
      case 't': data.abbrevtreehash = result;   break;
      case 'H': data.commithash = result; break;
      case 'P': data.parenthash = result; break;
      case 'T': data.treehash = result;   break;
      case 'at': data.authored = data.authored || {}; data.authored.unix = result[1]; break;
      case 'ct': data.commited = data.commited || {}; data.commited.unix = result[1]; break;
      case 'ar': data.authored = data.authored || {}; data.authored.ago = result[1]; break;
      case 'cr': data.commited = data.commited || {}; data.comimted.ago = result[1]; break;
      case 'aD': data.authored = data.authored || {}; data.authored.rfc = result[1]; break;
      case 'cD': data.commited = data.commited || {}; data.commited.rfc = result[1]; break;
      case 'ai': data.authored = data.authored || {}; data.authored.iso = result[1]; break;
      case 'ci': data.commited = data.commited || {}; data.commited.iso = result[1]; break;
    }
  }

  return data;
}

/**
 * Reformat the format pattern so we can actually parse it.
 *
 * @param {String} args The arguments which could contain a format
 * @returns {String} reformatted string.
 * @api public
 */
function reformatter(args) {
  return args.replace(reformat, separator +'$1'+ separator);
}

//
// Expose the module.
//
parser.reformat = reformatter;
parser.separator = separator;
module.exports = parser;

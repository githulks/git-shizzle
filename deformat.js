'use strict';

//
// Most of the output placeholders which are supported by the git command line's
// --format flag. Currently not including the table separators.
//
var placeholders = 'H|h|T|t|P|p|an|aN|ae|aE|ad|aD|ar|at|ai|cn|cN|ce|cE|cd|cD|cr|ct|ci|d|e|s|f|b|B|N|GG|G\\?|GS|GK|gD|gd|gn|gN|ge|gE|gs|m|n|\\%|x00'
  , reformat = new RegExp('(%('+ placeholders +'))', 'g');

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
  if (!~format.indexOf(separator)) format = reformatter(format);
  format = format.split(separator);

  var result = line.split(separator)
    , length = format.length
    , data = {}
    , i = 0;

  for (; i < length; i++) {
    if (format[i].charAt(0) !== '%') continue;

    switch (format[i]) {
      case '%h': data.abbrevcommithash = result[i]; break;
      case '%p': data.abbrevparenthash = result[i]; break;
      case '%t': data.abbrevtreehash = result[i];   break;
      case '%H': data.commithash = result[i]; break;
      case '%P': data.parenthash = result[i]; break;
      case '%T': data.treehash = result[i];   break;
      case '%at': data.authored = data.authored || {}; data.authored.unix = +result[i]; break;
      case '%ct': data.commited = data.commited || {}; data.commited.unix = +result[i]; break;
      case '%ar': data.authored = data.authored || {}; data.authored.ago = result[i]; break;
      case '%cr': data.commited = data.commited || {}; data.comimted.ago = result[i]; break;
      case '%aD': data.authored = data.authored || {}; data.authored.rfc = result[i]; break;
      case '%cD': data.commited = data.commited || {}; data.commited.rfc = result[i]; break;
      case '%ai': data.authored = data.authored || {}; data.authored.iso = result[i]; break;
      case '%ci': data.commited = data.commited || {}; data.commited.iso = result[i]; break;
    }
  }

  return data;
}

/**
 * Reformat the format pattern so we can actually parse it.
 *
 * @TODO specifically check for the --format or --pretty="format:" flags>
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

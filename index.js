'use strict';

var debug = require('diagnostics')('git-shizzle')
  , formatter = require('git-format')
  , shelly = require('shelljs')
  , fuse = require('fusing')
  , path = require('path');

/**
 * Create a human readable interface for interacting with the git binary that is
 * installed on the users host system. This allows us to interact with the git
 * in the given directory.
 *
 * The beauty of this system is that it allows human readable chaining:
 *
 * ```js
 * git().push('origin master');
 * ```
 *
 * @constructor
 * @param {String} dir The directory in which we should execute these commands.
 * @api public
 */
function Git(dir) {
  if (!(this instanceof Git)) return new Git();

  this.fuse();
  this.__dirname = dir;

  var git = this;

  this.parse = this._parsers.reduce(function reduce(parsers, parser) {
    parsers[parser.method] = function proxy(params, fn) {
      var async = 'function' === typeof arguments[arguments.length - 1]
        , args = parser.params +' '
        , format;

      if ('string' === typeof params) {
        args += params;
      } else if ('function' === typeof params) {
        fn = params;
      }

      //
      // Extract the format so we can use it in our parser.
      //
      format = formatter.extract(args) || '';
      args = formatter.reformat(args);

      if (!async) return parser.fn(git[parser.method](args), format, formatter);

      return git[parser.cmd || parser.method](args, function async(code, output) {
        if (+code) return fn(code, output);

        fn(code, parser.fn(output, format, formatter));
      });
    };

    return parsers;
  }, Object.create(null));
}

fuse(Git);

/**
 * List of all commands that are available for git.
 *
 * @type {Array}
 * @public
 */
Git.commands = [];

/**
 * The path to the `git` binary.
 *
 * @type {String}
 * @public
 */
Git.path = shelly.which('git');

//
// This is where all the magic happens. We're going to extract all the commands
// that this `git` binary supports and introduce them as API's on the prototype.
//
shelly.exec(Git.path +' help -a', {
  silent: true
}).output.split(/([\w|\-]+)\s{2,}/g).filter(function filter(line) {
  var trimmed = line.trim();

  //
  // Assume that every command is lowercase, this \w in the RegExp also includes
  // uppercase or mixed case strings. Which can actually capture $PATH\n in the
  // output. Additionally we need to remove all lines that still have spaces
  // after they're trimmed.
  //
  return trimmed.length
    && !~trimmed.indexOf(' ')
    && line === line.toLowerCase();
}).map(function map(line) {
  return line.trim();
}).forEach(function each(cmd) {
  var method = cmd
    , index;

  //
  // Some these methods contain dashes, it's a pain to write git()['symbolic-ref']
  // so we're transforming these cases to JS compatible method name.
  //
  while (~(index = method.indexOf('-'))) {
    method = [
      method.slice(0, index),
      method.slice(index + 1, index + 2).toUpperCase(),
      method.slice(index + 2)
    ].join('');
  }

  /**
   * Execute the introduced/parsed command.
   *
   * @param {String} params Additional command line flags.
   * @param {Function} fn Completion callback if you want async support.
   * @returns {String}
   * @api public
   */
  Git.readable(method, function proxycmd(params, fn) {
    var git = Git.path +' '+ cmd +' '
      , format;

    if ('string' === typeof params)  git += params;
    if ('function' === typeof params) fn = params;

    shelly.cd(this.__dirname);
    debug('executing cmd', git);

    var res = shelly.exec(git.trim(), { silent: true }, fn ? function cb(code, output) {
      if (+code) return fn(new Error((output || 'Incorrect code #'+ code).trim()));

      fn(undefined, output);
    } : undefined);

    //
    // Make sure we throw a code in sync mode instead of returning the error
    // body.
    //
    if (!fn && +res.code) {
      throw new Error((res.output || 'Incorrect code #'+ res.code).trim());
    }

    return res.output || '';
  });

  Git.commands.push(cmd);
});

/**
 * CD in to another directory.
 *
 * @type {Function}
 * @returns {Git}
 * @api public
 */
Git.readable('cd', function (dir) {
  this.__dirname = path.join(this.__dirname, dir);

  debug('updated the directory to', this.__dirname);
  return this;
});

/**
 * Add a new parser
 *
 * @param {String} method Name of the method we parse output from
 * @param {String} args The function params/args.
 * @param {Function} fn The parser function.
 * @returns {Git}
 * @api private
 */
Git.writable('_parsers', []);
Git.parse = function parse(method, data, fn) {
  data.params = data.params || data.args;
  data.method = data.method || method;
  data.fn = data.fn || fn;

  Git.prototype._parsers.push(data);

  return Git;
};

/**
 * Parse a list of tags out of the git logs.
 *
 * @type {Function}
 * @public
 */
Git.parse('tags', {
  params: '--date-order --tags --simplify-by-decoration --pretty=format:"%ai %h %d %s %cr %ae"',
  cmd: 'log'
}, function parse(output, format, formatter) {
  return output.split(/\n/).map(function map(line) {
    var meta = formatter(line, format);

    //
    // Only return if it's an actual tag.
    //
    if (~meta.ref.indexOf('tag:')) return meta;
  }).filter(Boolean);
});

/**
 * Parse the changes out of git log.
 *
 * @type {Function}
 * @public
 */
Git.parse('changes', {
  params: '--name-status --pretty=format:"%ai %h %d %s %cr %ae"',
  cmd: 'log'
}, function parse(output, format, formatter) {
  var commited = { M: 'modified', A: 'added', D: 'deleted' }
    , sep = formatter.separator;

  return output.split(/\n{2}/).slice(10).map(function reformat(line) {
    var changes = line.slice(line.lastIndexOf(sep) + sep.length).trim()
      , meta = formatter(line, format);

    meta.changes = changes.split(/\n/).reduce(function reduce(memo, change) {
      var type = commited[change.charAt(0)];

      if (!memo[type]) memo[type] = [];
      memo[type].push(change.slice(2));

      return memo;
    }, {});

    return meta;
  });
});

//
// Expose the module.
//
module.exports = Git;

# git-shizzle

`git-shizzle` is a wrapper around the `git` binary that is installed on the host
system. Interaction with the git has never been easier as we support both async
and sync API calls and additional parsers to extract useful data from your git
repositories.

## Installation

The module is designed for Node.js and is released in the public npm registry:

```
npm install --save git-shizzle
```

Is the only command you need to execute in your CLI in order to install the
module.

## Usage

In all of the following examples we assume that you've required the library as
following:

```js
'use stict';

var Git = require('git-shizzle');
```

We export `git` as a constructor but the API is we're using in the examples
allows chaining which results more readable code. So to create a git instance
you can do:

```js
Git();
```

Or:

```js
new Git()
```

To get the `status` of a git repository we can simply call the status method:

```js
var status = Git().status();
```

We can pass command line flags as arguments in the `status` method so if we want
to have an easy to parse format we can add the `--porcelain` option:

```js
var status = Git().status('--porcelain');
```

As stated in the introduction text of this document we support both async and
  sync APIs. To trigger the different modes you need to supply a completion
callback as last argument if you want **async** mode.

```js
Git().status('--porcelain', function (err, output) {
  console.log(output);
});
```

## The API methods

The API methods depend on the version of `git` that is installed on your system.
We parse our the commands from the `git help -a` output and introduce those in
the prototype. Commands that contain a dash like `symbolic-ref` are also aliased
with a camel case so it can be used as `symbolRef`.

## Custom parsers

As there thousands of ways to extract and parse data from git we added an
convenience method for parsing the output. You can register a custom parser
using:

```
Git.parse('<name>', {
  params: '--pretty=format:"%ai"',
  cmd: 'log'
}, function (output, format, formatter) {

});
```

- The `<name>` is the name of parser which will be introduced on the `.parse`
  object.
- The `params:` allows you to configure the params that it should pass in to the
  git command. If you include a `--pretty:format` we automatically wrap the
  placeholders using the `git-format` module so it can be easily extracted.
- The `cmd:` allows you to configure which method needs to be called.

The code above will introduce a new `.parse` property with the name `<name>`. So
if name was set to `example` we could use th newly introduced parser as:

```js
var output = Git().parse.example();

//
// Or async
//
Git().parse.example(function (err, output) {

});
```

## Debugging

The library is instrumented with [diagnostics][diagnostics] so you can set the
`DIAGNOSTICS` or `DEBUG` environment variable to `DEBUG=git-shizzle*` to receive
all the debug output from this module.

## License

MIT

[diagnostics]: https://github.com/3rd-Eden/diagnostics

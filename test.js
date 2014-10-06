describe('git-shizzle', function () {
  'use strict';

  var assume = require('assume')
    , Git = require('./')
    , git;

  beforeEach(function () {
    git = new Git();
  });

  it('exposes git as a function', function () {
    assume(Git).is.a('function');
  });

  it('can be initialised without a new keyword', function () {
    git = Git();
    assume(git).is.instanceOf(Git);
  });

  it('introduces a new parse object when constructed', function () {
    assume(git.parse).is.a('object');
    assume(Git.parse).is.a('function');
  });

  describe('#parse', function () {
    it('introduces a new parser', function () {
      assume(git.parse.randomname).is.not.a('function');

      Git.parse('myrandomname', { cmd: 'log', }, function () { });

      git = new Git();
      assume(git.parse.myrandomname).is.a('function');
    });
  });
});

describe('deformat', function () {
  'use strict';

  var deformat = require('./deformat')
    , reformat = deformat.reformat
    , assume = require('assume')
    , s = deformat.separator;

  it('is exposed as a function', function () {
    assume(deformat).is.a('function');
  });

  it('exposes the separator', function () {
    assume(s).is.a('string');
  });

  it('exposed the reformatter function', function () {
    assume(reformat).is.a('function');
  });

  describe('.reformat', function () {
    it('adds separators around the placeholders', function () {
      var format = reformat('%H');

      assume(format).equals(s +'%H'+ s);
    });

    it('also replaces multiple placeholders', function () {
      var format = reformat('hello %H world %cr lulz');

      assume(format).equals([
        'hello ',
        '%H',
        ' world ',
        '%cr',
        ' lulz'
      ].join(s));
    });
  });
});

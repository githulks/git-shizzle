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

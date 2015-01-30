describe('git-shizzle', function () {
  'use strict';

  var assume = require('assume')
    , Git = require('./')
    , git;

  beforeEach(function () {
    git = new Git(__dirname);
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

  describe('generated apis', function () {
    it('can get the status of this repo', function () {
      git.status();
    });

    it('can get the status of this repo in async', function (next) {
      git.status(function (err) {
        next(err);
      });
    });

    it('can pass in parameters', function () {
      assume(git.status('--help')).includes('GIT-STATUS(1)');
    });
  });

  describe('#parse', function () {
    it('introduces a new parser', function () {
      assume(git.parse.randomname).is.not.a('function');

      Git.parse('myrandomname', { cmd: 'log', }, function () { });

      git = new Git();
      assume(git.parse.myrandomname).is.a('function');
    });

    describe('#tags', function () {
      it('extracts git tags', function (next) {
        git.parse.tags(function (err, tags) {
          if (err) return next(err);

          var tag = tags.pop();

          assume(tags).is.a('array');
          assume(tag.authored.email).equals('info@3rd-Eden.com');
          assume(tag.subject).equals('[dist] 0.0.1');
          assume(tag.abbrevcommithash).equals('9163c88');

          next();
        });
      });
    });
  });

  describe('#cd', function () {
    it('can returns it self', function () {
      assume(git.cd('..')).equals(git);
    });

    it('should error as there is no git repo', function (next) {
      git.cd('..').status(function (err) {
        assume(err.message).includes('fatal');
        next();
      });
    });

    it('should throw error as there is no git repo', function (next) {
      try { git.cd('..').status(); }
      catch (e) {
        assume(e.message).includes('fatal');
        next();
      }
    });
  });
});

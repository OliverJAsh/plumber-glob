var chai = require('chai');
var should = chai.should();
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

require('mocha-as-promised')();


var Resource = require('plumber').Resource;
var Supervisor = require('plumber/lib/util/supervisor');

var glob = require('..');


describe('glob', function() {
  var supervisor;

  beforeEach(function() {
    supervisor = new Supervisor();
  });


  it('should be a function', function() {
    glob.should.be.a('function');
  });


  describe('#apply', function() {
    it('should be a function', function() {
      glob('files/*.js').should.be.a('function');
    });

    it('should return a promise of resources', function() {
      var globbedResources = glob('test/files/file-*.js')([], supervisor);
      return globbedResources.then(function(resources) {
        resources.length.should.equal(2);
        resources[0].filename().should.equal('file-1.js');
        resources[0].data().should.equal('var x = 42;\n');
        resources[0].type().should.equal('javascript');
        should.not.exist(resources[0].sourceMap());
        resources[1].filename().should.equal('file-2.js');
        resources[1].data().should.equal('function nothing() {\n}\n');
        resources[1].type().should.equal('javascript');
        should.not.exist(resources[1].sourceMap());
      });
    });

    it('should return a promise of resources with their source map', function() {
      var globbedResources = glob('test/files/concatenated.js')([], supervisor);
      return globbedResources.then(function(resources) {
        resources.length.should.equal(1);
        resources[0].filename().should.equal('concatenated.js');
        resources[0].data().should.equal('/* source */\nvar answer = 42;\nvar added = addOne(answer);\nfunction addOne(number) {\n  return number + 1;\n}\n');
        resources[0].type().should.equal('javascript');
        resources[0].sourceMap().should.be.an('object');
        resources[0].sourceMap().toString().should.deep.equal('{"version":3,"file":"concatenated.js","mappings":"AAAA;AACA;ACDA;AACA;AACA;AACA;AACA","sources":["../1.js","../2.js"],"sourcesContent":["/* source */\\nvar answer = 42;","var added = addOne(answer);\\nfunction addOne(number) {\\n  return number + 1;\\n}\\n"],"names":[]}');
      });
    });

    it('should pass through any input resources and append the globbed resources', function() {
      var inputRes = new Resource();
      var globbedResources = glob('test/files/file-*.js')([inputRes], supervisor);
      return globbedResources.then(function(resources) {
        resources.length.should.equal(3);
        resources[0].should.equal(inputRes);
      });
    });

  });


  describe('#within', function() {
    it('should be a function', function() {
      glob.within.should.be.a('function');
    });

    it('should return a glob function', function() {
      glob.within('test').should.be.a('function');
    });

    it('should return a glob function with a within function', function() {
      glob.within('test').within.should.be.a('function');
    });

    it('should match resources within the directories', function() {
      var globWithin = glob.within('test').within('files');
      var globbedResources = globWithin('file-*.js')([], supervisor);
      return globbedResources.then(function(resources) {
        resources.length.should.equal(2);
      });
    });
  });

  describe('#exclude', function () {
    it('should be a function', function() {
      glob.exclude.should.be.a('function');
    });

    it('should return a promise of resources', function() {
      var globbedResources = glob('test/files/file-*.js')([], supervisor);
      return globbedResources.then(function(resources) {
        return glob.exclude('test/files/file-1.js')(resources, supervisor);
      }).then(function (resources) {
        resources.length.should.equal(1);
        resources[0].filename().should.equal('file-2.js');
        resources[0].data().should.equal('function nothing() {\n}\n');
        resources[0].type().should.equal('javascript');
        should.not.exist(resources[0].sourceMap());
      });
    });
  });
});

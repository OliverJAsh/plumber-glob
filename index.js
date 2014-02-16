var appendResources = require('plumber').appendResources;

var q = require('q');
var path = require('path');
var flatten = require('flatten');

function identity(x){ return x; }

// FIXME: native helper?
// compose(f, g)(x) == f(g(x))
function compose(f, g) {
    return function() {
        return f(g.apply(null, arguments));
    };
}

function globOperation(mapper) {
    function glob(/* files... */) {
        var fileList = flatten([].slice.call(arguments)).map(mapper);
        return appendResources(function(supervisor) {
            var glob = supervisor.glob.bind(supervisor);
            return q.all(fileList.map(glob)).then(flatten).then(q.all);
        });
    }

    // recursively compose mappers
    glob.within = function(directory) {
        return globOperation(compose(mapper, function(file) {
            return path.join(directory, file);
        }));
    };

    glob.exclude = function (/* files... */) {
        var fileList = flatten([].slice.call(arguments)).map(mapper);
        // TODO: add `removeResources` method to plumber core?
        return function(inResources, supervisor) {
            var glob = supervisor.glob.bind(supervisor);
            return q.all(fileList.map(glob)).then(flatten).then(q.all).then(function(excludedResources) {
                return inResources.filter(function (inResource) {
                    return ! excludedResources.some(function (excludedResource) {
                        return excludedResource.filename() === inResource.filename();
                    });
                });
            });
        };
    };

    return glob;
};

module.exports = globOperation(identity);

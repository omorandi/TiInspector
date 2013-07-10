var _ = require('underscore'),
    path = require('path'),
    fs = require('fs'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter,
    async = require('async'),
    walk = require('walk'),
    xml2js = require('xml2js');

var TiProject = function(projectDir) {
    this.projectDir = projectDir;
};

util.inherits(TiProject, EventEmitter);

_.extend(TiProject.prototype, {

    projectFile: function(name) {
        return path.join(this.projectDir, name);
    },

    readSourceFile: function(name, callback) {
        if (typeof callback == "function") {
            fs.readFile(this.projectFile(name), 'utf8', callback);
            return;
        }
        return fs.readFileSync(this.projectFile(name), 'utf8');
    },

    writeSourceFile: function(name, data, callback) {
        if (typeof callback == "function") {
            fs.writeFile(this.projectFile(name), data, 'utf8', callback);
            return;
        }
        return fs.writeFileSync(this.projectFile(name), data,  'utf8');
    },

    readProjectFile: function(name, callback) {
        if (typeof callback == "function") {
            fs.readFile(this.projectFile(name), callback);
            return;
        }
        return fs.readFileSync(this.projectFile(name));
    },

    fileExists: function(file, callback) {
        var fileName = this.projectFile(file);
        fs.exists(fileName, function(result) {
           var err;
           if (!result) {
               err = new Error('Cannot find ' + fileName);
           }
           callback.call(null, err, result);
        });
    },

    checkTiProject: function(callback) {
        var checkFileExists = this.fileExists.bind(this);
        async.map(['tiapp.xml', 'Resources', 'manifest'], checkFileExists, callback);
    },

    findResourceFilesOfType: function(extension, callback) {
        var dir = this.projectFile('Resources');
        var walker = walk.walk(dir, {
            followLinks: false
        });

        walker.on('file', function(root, fileStat, next) {
            var fileName = path.join(root, fileStat.name);
            if (fileName.lastIndexOf(extension) == fileName.length - extension.length) {
                callback(null, fileName);
            }
            next();
        });
    },


    attachToTiProject: function(callback) {
        var self = this;
        this.checkTiProject(function(err) {
            if (err) {
                callback(err);
            }
            self.loadTiAppXml(function(err, tiapp) {
                self.appName = tiapp["ti:app"].name[0];
                callback(null, tiapp);
            });
        });
    },


    loadTiAppXml: function(callback) {
        if (this.tiApp) {
            callback(null, this.tiapp);
            return;
        }
        this.readProjectFile('tiapp.xml', function(err, tiapp) {
            xml2js.parseString(tiapp, callback);
        });
    },

    loadManifest: function(callback) {
        this.readProjectFile('manifest', function(err, data) {
            var str = data.toString();
            var manifest = {};
            var lines = str.split("\n");
            _.each(lines, function(line) {
                line = line.trim().replace("#", "");
                var sep = line.indexOf(":");
                if (sep == -1) {
                    callback.call(null,new Error("bad manifest file"));
                    return;
                }
                var key = line.substring(0, sep);
                var val = line.substring(sep + 1);
                manifest[key] = val;
            });
            callback.call(null, null, manifest);
        });
    }    

});

module.exports = TiProject;

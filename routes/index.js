var async = require('async');

var getTiapp = function(cb) {
  exports.tiProject.loadTiAppXml(cb);
};

var getManifest = function(cb) {
  exports.tiProject.loadManifest(cb);
};


var tiapp = null;
var manifest = null;

var getProjectFiles = function(callback) {
  if (tiapp) {
    callback(null, tiapp);
    return;
  }

  getTiapp(function(err, data) {
    callback(err, data);
  });
};

exports.index = function(req, res){
  
  getProjectFiles(function(err, tiapp) {
    if (err) {
      res.send(500, "Cannot load tiapp.xml");
      return;
    }
    var projectDir = exports.tiProject.projectDir;

    var name = tiapp["ti:app"].name[0];

    name = name.substring(0, 1).toUpperCase() + name.substring(1);

    var data = [
      {name: "Location: ", value: projectDir},
      {name: "Application ID: ", value: tiapp["ti:app"].id[0]}
    ];
    
    var description = tiapp["ti:app"].description[0];
    if (description) {
      data.push({name: "Description: ", value: description});
    }

    res.render('index', {name: name, data: data, id: "home"});
  });
};

exports.appicon = function(req, res) {
  var project = exports.tiProject;

  getProjectFiles(function(err, tiapp) {
    var icon = tiapp["ti:app"].icon[0];
    project.readProjectFile("Resources/iphone/" + icon, function(err, data) {
      if (!err) {
        res.setHeader('Content-Type', 'image');
        res.send(data);
      }
    });
  });
  //project.readProjectFile("Resources/iphone/appicon")
};


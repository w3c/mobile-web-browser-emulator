var express = require('express'),
    app = express(),
    http = require('http').Server(app),
    fs = require('fs');


var serverport;

exports.start = function(port, path) {
    path = __dirname + path;
    app.use(express.static(path));

    serverport = port || 3001;
    http.listen(port, function() {
    });
};

exports.close = function() {
    http.close();
};

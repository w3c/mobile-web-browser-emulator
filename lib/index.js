// Dependencies
var headless = require('headless'),
    util = require("util"),
    events = require("events");

function Sink() {}
util.inherits(Sink, events.EventEmitter);

var MobileBrowser = function() {};

MobileBrowser.prototype.emulate = function(options, cb) {
    // options :
    // url : url of web application to load.
    // device.width : width of emulated device.
    // device.height : height of emulated device.
    // browser.width : width of displayed browser.
    // browser.height : height of displayed browser.

    var sink = new Sink();
    var self = this;
    self.sink = sink;
    self.options = options;
    self.cb = cb;

    var deviceOptions = {
        display: {
            width: options.width,
            height: options.width
        }
    }

    headless(deviceOptions, function(err, childProcess, servernum) {
        var Browser = require('./browser-emulator').Browser;
        var browser = new Browser({
            browserWidth: options.width,
            browserHeight: options.height,
            uaHeader: 'Mozilla/5.0 (Linux; Android 4.4.4; Galaxy Nexus Build/IMM76B) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/36.0.1025.133 Mobile Safari/535.19',
            displayServer: servernum,
            browsermobProxy: {
                port: 8080
            },
            trackNetwork: true
        });
        browser.open(self.options.url);
        browser.on('error', function(err) {
            console.log(err);
        });
        browser.on('done', function() {
            self.sink.emit('end');
        });
        browser.on('screenshot', function(path) {
            console.log('screenshot save as ' + __dirname + path);
        });
        self.cb(browser);
        browser.close();
        return;
    });
};

exports.MobileBrowser = MobileBrowser;
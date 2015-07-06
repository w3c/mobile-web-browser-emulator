var webdriver = require('selenium-webdriver');
var metaparser = require('metaviewport-parser');
var fs = require("fs");
var easyimg = require('easyimage');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var uuid = require('node-uuid');
var rimraf = require('rimraf');
var domain = require('domain');

var Browser = function(config) {
    var display, uaHeader, trackNetwork, proxy, driver,
        tmpdir, uadir, proxyPort;
    var chromeservice;
    var display, uaHeader, trackNetwork, proxy, driver,
    tmpdir, uadir, proxyPort;
    var pendingTasks = null;
    var networkDataGatheringDone = function() {};
    var pendingNetworkDataGathering = 0;
    var self = this;
    var flow = webdriver.promise.controlFlow();
    var driverPromise = new webdriver.promise.Deferred();
    var closed = false;
    var d = domain.create();
    d.on('error', function(err) {
        console.error(err);
        if (err) {
            console.log(err.stack);
        }
    });

    function init() {
        config = config || {};
        self.webdriver = webdriver;
        self.viewport = {};
        self.width = config.browserWidth || 320;
        self.height = config.browserHeight || 480;
        self.desktopWidth = config.browserDekstopWidth || self.width * 3;
        self.desktopHeight = config.browserDekstopHeight || self.height * 3;
        self.network = null;
        proxyPort = config.proxyPort || 8128;
        display = config.displayServer || 0;
        uaHeader = config.uaHeader || "";
        tmpdir = config.tmpdir || "/tmp";
        uadir = tmpdir + "/mobile-checker-" + uuid.v4();
        trackNetwork = config.trackNetwork || false;
        if (trackNetwork) {
            setupProxy();
        }
        d.add(this);
    }

    function setupProxy() {
        var NetworkInterceptor = function () {
            var self = this;
            var ThinProxy = require('thin');
            var proxy = new ThinProxy({strictSSL:true, followRedirect: false});
            var pendingNetworkDataGathering = null;
            var pendingNetworkDataProcessing = 0;
            var loaded = false;
            var closed = false;

            var responseListeners = [];
            var requestListeners = [];
            var doneListeners = [];

            d.add(proxy);

            self.on('newListener', function(eventName, listener) {
                if (eventName === "request") {
                    requestListeners.push(listener);
                } else if (eventName === "response") {
                    responseListeners.push(listener);
                } else if (eventName === "done") {
                    doneListeners.push(listener);
                }
            });

            function responseDone() {
                pendingNetworkDataGathering--;
                networkGatheringDone();
            }

            function finishNetworkGathering() {
                if (closed) {
                    return;
                }
                closed = true;
                proxy.close(function (err) {
                    if (err) {
                        console.log(err.stack);
                    }
                });
                if (pendingNetworkDataGathering === null || doneListeners.length === 0) {
                    self.emit('processingdone');
                    return;
                }
                doneListeners.forEach(function(l) {
                    pendingNetworkDataProcessing = 0;
                    pendingNetworkDataProcessing++;
                    l(function () {
                        pendingNetworkDataProcessing--;
                        if (pendingNetworkDataProcessing === 0) {
                            self.emit('processingdone');
                        }
                        });
                });
            }

            function networkGatheringDone() {
                if ((pendingNetworkDataGathering === 0 || pendingNetworkDataGathering === null)
                    && loaded) {
                    finishNetworkGathering();
                }
            }

            proxy.use(function(req, res, next) {
                d.add(req);
                d.add(res);
                requestListeners.forEach(function (l) {
                    l(req, res, networkGatheringDone);
                });
                proxy.forward(req, res, function (proxyReq) {
                    d.add(proxyReq);
                    proxyReq.on('response', function (serverResponse) {
                        d.add(serverResponse);
                        responseListeners.forEach(function (l) {
                            if (pendingNetworkDataGathering === null) {
                                pendingNetworkDataGathering = 0;
                            }
                            pendingNetworkDataGathering++;
                            l(req, serverResponse, responseDone);
                        });
                    });
                });
                next();
            });


            proxy.on("request", function(req) {
                req.startTime = new Date();
            });

            proxy.on("error", function(err) {
                console.log(err);
                self.emit("proxyError", err);
            });

            proxy.listen(proxyPort, '0.0.0.0', function(err) {
                self.emit("proxyError", err);
            });

            self.stop = function() {
                loaded = true ;
                networkGatheringDone();
                // we timeout after 10s
                setTimeout(finishNetworkGathering, 10000);

            };
        };

        util.inherits(NetworkInterceptor, EventEmitter);

        self.network = new NetworkInterceptor();
        d.add(self.network);
    }

    function setupBrowser() {
        var chromedriver = require("chromedriver");
        var chrome = require("selenium-webdriver/chrome");
        var proxy = require('selenium-webdriver/proxy');
        var capabilities = webdriver.Capabilities.chrome();

        var proxyPrefs = proxy.manual({
            http: '0.0.0.0:' + proxyPort,
            https: '0.0.0.0:'+proxyPort
        });
        capabilities.set(webdriver.Capability.PROXY, proxyPrefs);

        // enabling metaviewport
        var options = new chrome.Options();
        //options.addArguments(["--enable-viewport-meta"]);
        options.addArguments(["--user-data-dir=" + uadir]);

        if (uaHeader) {
            options.addArguments(['--user-agent=' + uaHeader]);
        }
        options.addArguments(['--disable-bundled-ppapi-flash']);
        options.setUserPreferences({"session.startup_urls": ["about:blank"],
                                   "session.restore_on_startup": 4});
        capabilities.merge(options.toCapabilities());

        options.detachDriver(false);
        process.env.DISPLAY = ':' + display;
        chromeservice = new chrome.ServiceBuilder(chromedriver.path)
            .withEnvironment(process.env)
            .build();
        driver = new chrome.Driver(capabilities, chromeservice);
    }

    function get(url, done) {
        var time = Date.now();
        return driver.get(url).then(function() {
            time = Date.now() - time;
            self.emit('pageSpeed', time);
        }).then(function() {
            return dontGiveUpOnModal(function(d) {
                return setViewPort(d);
            }, driver);
        });
    }


    // dontGiveUp from https://gist.github.com/domenic/2936696
    // we need to protect any code sent to the drivder
    // from UnexpectedAlertOpenError
    // we dismiss alerts 10 times at most
    function dontGiveUpOnModal(f, d, count) {
        if (!count) {
            count = 10;
        }
        return f(d).then(
            undefined, // pass through success
            function(err) {
                if (err.name === "UnexpectedAlertOpenError" && count >
                    0) {
                    // dismiss alert and retry
                    var alert = d.switchTo().alert();
                    alert.getText().then(function(text) {
                        self.emit('alert', text);
                    });
                    return alert.dismiss().then(function() {
                        dontGiveUpOnModal(f, d, count - 1);
                    });
                }
                self.emit('fatalerror', err);
                closeBrowser(d);
            }
        );
    }


    function setViewPort(d) {
        var contentAttr;
        return d.findElements(webdriver.By.css('meta[name="viewport"]')).then(
            function(viewportDecls) {
                // return all the metaviewports found
                webdriver.promise.map(
                    viewportDecls,
                    function(el) {
                        return el.getAttribute("content");
                    }
                ).then(
                    function(contentAttrs) {
                        contentAttr = contentAttrs[contentAttrs.length -
                            1];
                    }
                );
            }).then(function() {
            if (contentAttr) {
                var viewportProps = metaparser.parseMetaViewPortContent(
                    contentAttr);
                self.viewport = metaparser.getRenderingDataFromViewport(
                    viewportProps.validProperties, self.width, self
                    .height, 4, 0.25);
            } else {
                self.viewport = {
                    zoom: null,
                    width: self.desktopWidth,
                    height: self.desktopHeight
                };
            }
            return d.manage().window().setSize(
                self.viewport.width,
                self.viewport.height + 97 //97px for the browser UI
            );
        }).then(function() {
            return d.executeScript(function() {
                // remove scrollbar
                // TODO webkit specific

                var style = document.createElement("style");
                var cssNoScrollbar = document.createTextNode(
                    "::-webkit-scrollbar { width: 0; height: 0;} body { overflow: hidden}"
                );
                style.appendChild(cssNoScrollbar);
                document.getElementsByTagName("head")[0].appendChild(
                    style);
            }).then(driverPromise.fulfill(d));
        });
    }

    this.abort = function() {
        return driverPromise.then(closeBrowser);
    }

    function closeBrowser(d, processToKill) {
        if (closed) {
            return new webdriver.promise.Deferred().fulfill();
        }
        return d.close().then(d.quit.bind(d)).then(chromeservice.stop.bind(chromeservice)).then(function() {
            closed = true;
            rimraf(uadir, function () {});
            if (processToKill) {
                processToKill.kill();
            }
        });
    }

    this.close = function(processToKill) {
        var networkdone = new webdriver.promise.Deferred();
        if (self.network) {
            self.network.once("processingdone", function() {
                networkdone.fulfill();
            });
            setTimeout(function () {
                networkdone.fulfill();
            }, 10000);
        } else {
            networkdone.fulfill();
        }
        var tasksdone = new webdriver.promise.Deferred();
        self.on("tasksdone", function() {
            tasksdone.fulfill();
        });
        if (pendingTasks === null) {
            self.emit("tasksdone");
        }
        return self.do(function(d) {
            self.network.stop();
            return networkdone.then(function () { return tasksdone;})
                .then(function() {
                    self.emit('done');
                    return closeBrowser(d, processToKill);
                });
        }, true);
    };

    this.open = function(url) {
        setupBrowser();
        return get(url);
    };

    function taskDone() {
        pendingTasks--;
        if (pendingTasks === 0) {
            self.emit("tasksdone");
        }
    }

    this.do = function(fn, nowait) {
        if (!nowait) {
            pendingTasks = pendingTasks || 0;
            pendingTasks++;
        }
        return driverPromise.then(function(d) {
            return dontGiveUpOnModal(function() {
                return flow.execute(
                    function() {
                        return fn(d, taskDone);
                    })
            }, d);
        });
    };

    this.takeScreenshot = function(path) {
        return self.do(function screenshot(d) {
            d.takeScreenshot().then(function(data) {
                var base64Data = data.replace(
                    /^data:image\/png;base64,/, "");
                fs.writeFile(path, base64Data, 'base64',
                    function(err) {
                        if (err) {
                            self.emit('error', err);
                        } else {
                            // resize the screenshot
                            easyimg.resize({
                                src: path,
                                dst: path,
                                width: self.width,
                                height: self.height
                            })
                                .then(function() {
                                    self.emit('screenshot',
                                        path);
                                }, function(err) {
                                    console.log(err);
                                    self.emit('error', err);
                                });
                        }
                    });
            });
        }, true);
    };

    init();
};

util.inherits(Browser, EventEmitter);

exports.Browser = Browser;

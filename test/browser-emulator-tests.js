global.rootRequire = function(name) {
    return require(__dirname + '/../' + name);
};

var Browser = require("../lib/browser-emulator").Browser,
    expect = require("expect.js"),
    webdriver = require('selenium-webdriver');



describe("Starting and quiting browser", function() {
    it('should start and stop without error with correct proxy', function(
        done) {
        var browser = new Browser({
            port: 8080,
            trackNetwork: true
        });
        browser.on('error', function(msg) {
            expect().fail(msg);
            done();
        });
        browser.open("file://" + __dirname + "/browser-tests/ok.html");
        browser.close().then(done);
    });

    it('should emit an error with incorrect proxy', function(done) {
        var browser = new Browser({
            browsermobProxy: {
                port: 9999
            },
            trackNetwork: true
        });
        browser.on('error', function(err) {
            expect(err.message).to.contain(
                'Failed gathering network traffic: Error: connect ECONNREFUSED'
            );
            done();
        });
        browser.open("file://" + __dirname + "/browser-tests/ok.html");
        browser.close().then(done);
    });

});

describe("Getting data from network", function() {
    var server = require("./test_server/test_app.js");
    var browser = new Browser({
        browsermobProxy: {
            port: 8080
        },
        trackNetwork: true
    });

    before(function() {
        server.start(3001, '/../browser-tests');
    });

    it("should get the status code of a loadable page", function(done) {
        browser.on('har', function(har) {
            expect(har.log.entries[0].response.status).to.be(200);
        });
        browser.open("http://localhost:3001/ok.html");
        browser.close().then(done);
    });
    
    after(function() {
        server.close();
    });
});

describe("Getting data from browser and network", function() {
    var server = require("./test_server/test_app.js");
    var browser = new Browser({
        browsermobProxy: {
            port: 8080
        },
        trackNetwork: true
    });
    before(function() {
        server.start(3001, '/../browser-tests');
    });

    it("should get the status code and title of a loadable page", function(done) {
        browser.on('har', function(har) {
            expect(har.log.entries[0].response.status).to.be(200);
        });

        browser.open("http://localhost:3001/ok.html");
        browser.do(function(d) {
            return d.findElement(browser.webdriver.By.tagName('title')).then(
                function(title) {
                    title.getInnerHtml().then(function(titleText) {
                        expect(titleText).to.be('OK');
                    });
                }
            );
        });
        browser.close().then(done);
    });
    
    after(function() {
        server.close();
    });
});

describe("Getting data from browser", function() {

    it('should return the title of the page "OK"', function(done) {
        var browser = new Browser();
        
        browser.open("file://" + __dirname + "/browser-tests/ok.html");
        browser.do(function(driver) {
            return driver.findElement(webdriver.By.tagName('title'))
                .then(function(title) {
                    title.getInnerHtml().then(function(
                        titleText) {
                        expect(titleText).to.be('OK');
                    });
                });
        });
        browser.close().then(done);
    });

    it('should return the title of the page "Alert1", even with an alert',
    function(done) {
        var browser = new Browser();
        
        browser.open("file://" + __dirname + "/browser-tests/alert.html");
        browser.on('alert', function(text) {
            expect(text).to.be('test');
        });
        browser.do(function(driver) {
            return driver.findElement(webdriver.By.tagName('title'))
                .then(function(title) {
                    title.getInnerHtml().then(function(
                        titleText) {
                        expect(titleText).to.be('Alert');
                    });
                });
        });
        browser.close().then(done);
    });
    
    it('should return the title of the page "Alert2", even with a delayed alert',
    function(done) {
        var browser = new Browser();
        browser.open("file://" + __dirname +
            "/browser-tests/alert2.html");
        browser.on('alert', function(text) {
            expect(text).to.be('test');
        });
        setTimeout(function() {
            browser.do(function(driver) {
                return driver.findElement(webdriver.By.tagName(
                    'title')).then(function(title) {
                    title.getInnerHtml().then(function(
                        titleText) {
                        expect(titleText).to.be('Alert2');
                    });
                });
            });
        }, 3500);
        browser.close().then(done);
    });
});

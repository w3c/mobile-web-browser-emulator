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
            proxyPort: 8000,
            trackNetwork: true
        });
        browser.on('error', function(msg) {
            expect().fail(msg);
            done();
        });
        browser.open("file://" + __dirname + "/browser-tests/ok.html");
        browser.close().then(done);
    });

});

describe("Getting data from network", function() {
    var server, browser;
    before(function() {
        server = require("./test_server/test_app.js");
        browser = new Browser({
            proxyPort: 8081,
            trackNetwork: true
        });
        server.start(3001, '/../browser-tests');
    });

    it("should get the status code of a loadable page", function(done) {
        browser.network.on('response', function(req, res, bdone) {
            expect(res.statusCode).to.be(200);
            res.on('end', function() { bdone();});
        });
        browser.open("http://localhost:3001/ok.html");
        browser.close().then(done);
    });

    after(function() {
        server.close();
    });
});

describe("Getting data from browser and network", function() {
    var server, browser;

    before(function() {
        server = require("./test_server/test_app.js");
        browser = new Browser({
            proxyPort: 8082,
            trackNetwork: true
        });
        server.start(3001, '/../browser-tests');
    });

    it("should get the status code and title of a loadable page", function(
        done) {
        browser.network.on('response', function(req, res, bdone) {
            expect(res.statusCode).to.be(200);
            res.on('end', function() { bdone();});
        });

        browser.open("http://localhost:3001/ok.html");
        browser.do(function(d, bdone) {
            return d.findElement(browser.webdriver.By.tagName('title')).then(
                function(title) {
                    title.getInnerHtml().then(function(
                        titleText) {
                        expect(titleText).to.be('OK');
                        bdone();
                    });
                });
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
        browser.do(function(driver, bdone) {
            return driver.findElement(webdriver.By.tagName('title'))
                .then(function(title) {
                    title.getInnerHtml().then(function(
                        titleText) {
                        expect(titleText).to.be('OK');
                        bdone();
                    });
                });
        });
        browser.close().then(done);

    });

    it('should return the title of the page "Alert1", even with an alert',
        function(done) {
            var browser = new Browser();
            browser.open("file://" + __dirname +
                "/browser-tests/alert.html");
            browser.on('alert', function(text) {
                expect(text).to.be('test');
            });
            browser.do(function(driver, bdone) {
                return driver.findElement(webdriver.By.tagName('title'))
                    .then(function(title) {
                        title.getInnerHtml().then(function(
                            titleText) {
                            expect(titleText).to.be('Alert');
                            bdone();
                        });
                    });
            });
            browser.close().then(done);
        });

    it(
        'should return the title of the page "Alert2", even with a delayed alert',
        function(done) {
            var browser = new Browser();
            browser.open("file://" + __dirname +
                "/browser-tests/alert2.html");
            browser.on('alert', function(text) {
                expect(text).to.be('test');
                browser.close().then(done);
            });
            setTimeout(function() {
                browser.do(function(driver, bdone) {
                    return driver.findElement(webdriver.By.tagName(
                        'title')).then(function(title) {
                        title.getInnerHtml().then(function(
                            titleText) {
                            expect(titleText).to.be(
                                'Alert2');
                            bdone();
                        });
                    });
                });
            }, 3500);
        });


});


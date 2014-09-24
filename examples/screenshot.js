var MobileBrowser = require('../lib/index.js').MobileBrowser;
var mobileBrowser = new MobileBrowser();
mobileBrowser.emulate({
	url: 'http://google.com',
	width: 300,
	height: 700
},
function(browser) {
	browser.takeScreenshot(__dirname + "/../screenshot.png");
});
var MobileBrowser = require('../lib/index.js').MobileBrowser;
var mobileBrowser = new MobileBrowser();
mobileBrowser.emulate({
	url: 'http://google.com',
	width: 300,
	height: 700
},
function(browser) {
	browser.do(function(driver) {
		driver.getTitle().then(function(title) {
			console.log(title);
		});
	});
});
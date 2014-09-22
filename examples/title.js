var MobileBrowser = require('../lib/index.js').MobileBrowser;
var mobileBrowser = new MobileBrowser();
mobileBrowser.emulate({
	width: 300,
	height: 700,
	url: 'http://google.com'
}, function(browser) {
	browser.do(function(driver) {
		driver.getTitle().then(function(title) {
   			console.log(title);
 		});
	});
});
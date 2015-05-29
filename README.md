[![Dependency Status](https://david-dm.org/w3c/mobile-web-browser-emulator.svg)](https://david-dm.org/w3c/mobile-web-browser-emulator)
[![devDependency Status](https://david-dm.org/w3c/mobile-web-browser-emulator/dev-status.svg)](https://david-dm.org/w3c/mobile-web-browser-emulator#info=devDependencies)

# Mobile Web Browser Emulator

Mobile Web Browser Emulator is a node.js tool which simulate a browser on a mobile device based on chrome. This module also allow manipulation via selenium webdriver.

It could be an easy way to test your mobile web application on a mobile device.
This module is implemented in the new version of W3C's mobileOK Checker (renamed as mobile checker, it is in current development).

This application work in [headless](https://github.com/kesla/node-headless) mode (powered via XVFB). So use it on server side would be so easy.

![alt google screenshot](https://github.com/guibbs/mobile-web-browser-emulator/blob/master/examples/screenshots/google.png)
![alt w3c screenshot](https://github.com/guibbs/mobile-web-browser-emulator/blob/master/examples/screenshots/w3.png)

# Install

This API need [BrowserMob Proxy](http://bmp.lightbody.net/) running. Maybe it will disappear in the futur.

It will be available on npm soon. For the moment, clone the repository in your node_modules directory.

# API

With Mobile Web Browser Emulator, it will easy like a piece of cake to test your mobile web applications in [using selenium web driver API](http://selenium.googlecode.com/git/docs/api/javascript/index.html).

emulation example (see code comments for some explainations) :
````javascript

//dependencie
var MobileBrowser = require('mobile-web-browser-emulator').MobileBrowser;

//create a new mobile browser
var mobileBrowser = new MobileBrowser();

//emulate browser with parameters you want. You can set tablet, smartphone or
//desktop dimensions.
mobileBrowser.emulate(
	url: 'http://google.com', //url to load. required
	width: 300, //width of your device. optional (300 by default)
	height: 700 //height of your device. optional (300 by default)
},
//second parameter will be a callback which get the browser object
function(browser) {
	//do what you want with your browser.
});
````

browser methods :

	browser.do(function(driver) { //take a function in parameter
		// get a driver object which can be use with selenium webdriver
	});
	browser.takeScreenshot('example.png') //take path of your screenshot in parameters.

manipulation with selenium example :
````javascript
var MobileBrowser = require('../lib/index.js').MobileBrowser;
var mobileBrowser = new MobileBrowser();
mobileBrowser.emulate(
	url: 'http://google.com',
	width: 300,
	height: 700
},
function(browser) {
	browser.do(function(driver) {
		driver.getTitle().then(function(title) { //selenium webdriver method
			console.log(title);
		});
	});
});
````

screenshot example :
````javascript
var MobileBrowser = require('../lib/index.js').MobileBrowser;
var mobileBrowser = new MobileBrowser();
mobileBrowser.emulate(
	url: 'http://google.com',
	width: 300,
	height: 700
},
function(browser) {
	browser.takeScreenshot(__dirname + "/../screenshot.png");
});
````

#Licence

Copyright (c) 2014 Dominique Hazael Massieux, Guillaume Baudusseau

MIT

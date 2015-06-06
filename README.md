[![Dependency Status](https://david-dm.org/w3c/mobile-web-browser-emulator.svg)](https://david-dm.org/w3c/mobile-web-browser-emulator)
[![devDependency Status](https://david-dm.org/w3c/mobile-web-browser-emulator/dev-status.svg)](https://david-dm.org/w3c/mobile-web-browser-emulator#info=devDependencies)

# Mobile Web Browser Emulator

Mobile Web Browser Emulator is a Node.js tool which simulates a Chrome-based browser on a mobile device. This module also allows manipulation via Selenium WebDriver. It is an easy way to test mobile web applications on mobile devices.

This module is used by the new version of the [Mobile Checker by W3C](https://validator.w3.org/mobile-alpha/).

This application works in [headless](https://github.com/kesla/node-headless) mode (powered via XVFB). Using it on the server side is easy.

![alt google screenshot](https://github.com/guibbs/mobile-web-browser-emulator/blob/master/examples/screenshots/google.png)
![alt w3c screenshot](https://github.com/guibbs/mobile-web-browser-emulator/blob/master/examples/screenshots/w3.png)

## Install

Start by having [BrowserMob Proxy](http://bmp.lightbody.net/) set up and running. Then run the following command

```
npm install mobile-web-browser-emulator
```

## API

With Mobile Web Browser Emulator, it is easy test mobile web applications [using the Selenium WebDriver API](http://selenium.googlecode.com/git/docs/api/javascript/index.html).

Emulation example:

```javascript
var MobileBrowser = require('mobile-web-browser-emulator').MobileBrowser;
var mobileBrowser = new MobileBrowser();

mobileBrowser.emulate(
  // Parameters such as dimensions for tablets, smartphones or desktops.
  {
    url: 'https://www.google.com/', // URL to load. **required**
    width: 300, // Width of the device. **optional** (300 by default)
    height: 700 // Height of the device. **optional** (300 by default)
  },
	// The second parameter is a callback that takes a browser instance as an argument
	function(browser) { /* ... */ }
);
```

Methods on the `browser` object:

```javascript
browser.do(function(driver) {
  // The driver object can then be used with Selenium WebDriver
});
browser.takeScreenshot('example.png');
```

Manipulation with Selenium example :

```javascript
var MobileBrowser = require('../lib/index.js').MobileBrowser;
var mobileBrowser = new MobileBrowser();

mobileBrowser.emulate({
  url: 'https://www.google.com',
  width: 300,
  height: 700
}, function(browser) {
  browser.do(function(driver) {
    driver.getTitle().then(function(title) { // Selenium Webdriver Method
      console.log(title);
    });
  });
});
```

Screenshot example:

```javascript
var MobileBrowser = require('../lib/index.js').MobileBrowser;
var mobileBrowser = new MobileBrowser();

mobileBrowser.emulate({
  url: 'https://www.google.com',
  width: 300,
  height: 700
}, function(browser) {
  browser.takeScreenshot(__dirname + "/../screenshot.png");
});
```

## Licence

Copyright (c) 2014 Dominique Hazael Massieux, Guillaume Baudusseau

MIT

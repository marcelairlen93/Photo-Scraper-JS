const puppeteer = require('puppeteer')

async function startBrowser () {
  let browser
  try {
    console.log('Opening the browser......')
    browser = await puppeteer.launch({
	    headless: false,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
	    args: ['--disable-setuid-sandbox'],
	    ignoreHTTPSErrors: true
	  })
  } catch (err) {
	    console.log('Could not create a browser instance => : ', err)
  }
  return browser
}

module.exports = {
  startBrowser
}

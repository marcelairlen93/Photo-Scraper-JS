const fs = require('fs')
const axios = require('axios')

const scraperObject = {
  url: 'https://nossoelodigital.48px.com.br/psenha.aspx?i=1f1d1d1b-f24b-4023-ae09-0fbc9b4a514f.aspx',
  async scraper (browser) {
    try {
      const page = await browser.newPage()
      console.log(`Navigating to ${this.url}...`)
      await page.goto(this.url, {
        waitUntil: 'load'
      })

      let imgsArr = []

      //  This is main download function which takes the url of your image
      async function download (uri, filename) {
        return new Promise(async (resolve, reject) => {
          try {
            const response = await axios({
              method: 'GET',
              url: uri,
              responseType: 'stream'
            })

            const w = response.data.pipe(fs.createWriteStream(`./images/${filename}`))
            w.on('finish', () => {
              console.log('Successfully downloaded file!')
            })
            resolve(true)
          } catch (err) {
            reject(err.message)
            throw new Error(err)
          }
        })

        // return new Promise((resolve, reject) => {
        //   const destination = `./images/${filename}`
        //   const file = fs.createWriteStream(destination)

        //   https.get(uri, response => {
        //     response.pipe(file)

        //     file.on('finish', () => {
        //       file.close(resolve(true))
        //     })
        //   }).on('error', error => {
        //     fs.unlink(destination)

        //     reject(error.message)
        //   })
        // })
      }

      console.log('Accessing Nosso Elo Login Page')

      // Accessing Nosso Elo Login page

      await page.waitForSelector('input[name=_senha]')

      await page.focus('input[name=_senha]')

      await page.evaluate(() => {
        const email = document.querySelector('input[name=_senha')
        email.value = 'nossoelo2022'
      })

      await page.click('input[type="submit"]')

      // Accessing photo gallery

      console.log('Accessing Photo Gallery')

      // console.log('Waiting for page load')

      // await page.waitForNavigation({
      //   waitUntil: 'load',
      //   timeout: 180000
      // })

      // console.log('Page loaded')

      async function scrapeCurrentPage () {
        console.log('Capturing images srcs from DOM')

        await page.waitForSelector('a.fancybox-thumb > img.img-responsive[src]')
        await page.waitForSelector('#page-selection > ul > li.next')

        const imgsRaw = await page.$$eval('a.fancybox-thumb > img.img-responsive[src]', imgs => imgs.map(img => img.getAttribute('src')))

        const imgs = imgsRaw.map((img) => {
          const [imgBaseURL, queryParams] = img.split('?')

          const photoIdPattern = /&i=.+\.JPG/

          const photoIdParam = queryParams.match(photoIdPattern)

          const photoIdParamTransformed = photoIdParam[0].replace('&', '')

          const fileName = photoIdParamTransformed.replace(/i=1f1d1d1b-f24b-4023-ae09-0fbc9b4a514f_(_)*/, '')

          const imgURL = `${imgBaseURL}?${photoIdParamTransformed}`

          return { imgURL, fileName }
        })

        console.log('Images loaded', imgs)

        imgsArr = [...imgsArr, ...imgs]

        let nextButtonExist = false

        const nextPageBtn = await page.$('#page-selection > ul > li.next')
        const nextPageBtnClassName = await page.evaluate(el => el.className, nextPageBtn)
        try {
          nextButtonExist = !nextPageBtnClassName.includes('disabled')
        } catch (err) {
          nextButtonExist = false
        }
        if (nextButtonExist) {
          await nextPageBtn.click()
          return await scrapeCurrentPage() // Call this function recursively
        }
      }

      await scrapeCurrentPage()

      console.log(`Total images found: ${imgsArr.length}`)

      console.log('Downloading images: \n')

      let result
      const errors = []

      for (let i = 0; i < imgsArr.length; i++) {
        const { imgURL, fileName } = imgsArr[i]

        result = await download(imgURL, fileName)

        if (result === true) {
          console.log('Success:', fileName, 'has been downloaded successfully.')
        } else {
          errors.push(imgsArr[i])
          console.log('Error:', fileName, 'was not downloaded.')
          console.error(result)
        }
      }

      console.log('Finished images download')
    } catch (error) {
      console.error('An error was thrown:\n\n')
      console.error(error)
    } finally {
      await browser.close()
    }
  }
}

module.exports = scraperObject

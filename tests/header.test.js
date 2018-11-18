const puppeteer = require('puppeteer')

let browser, page

beforeEach(async () => {
  browser = await puppeteer.launch({
    headless: false
  })
  page = await browser.newPage()
  await page.goto('http://localhost:3000')
})

afterEach(async () => {
  await browser.close()
})

test('display logo when navigate to the root url', async () => {
  const text = await page.$eval('a.brand-logo', el => el.innerHTML)

  expect(text).toEqual('Blogster')
})

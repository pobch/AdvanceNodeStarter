const puppeteer = require('puppeteer')
const Page = require('./helpers/Page')

let browser, page

beforeEach(async () => {
  browser = await puppeteer.launch({
    headless: false
  })
  const puppeteerPage = await browser.newPage()
  const customPage = new Page(puppeteerPage)

  page = new Proxy(customPage, {
    get(target, property) {
      return customPage[property] || puppeteerPage[property]
    }
  })

  await page.goto('http://localhost:3000')
})

afterEach(async () => {
  await browser.close()
})

test('the header has the correct text', async () => {
  const text = await page.$eval('a.brand-logo', el => el.innerHTML)

  expect(text).toEqual('Blogster')
})

test('clicking login starts oAuth flow', async () => {
  await page.click('.right a')
  const url = await page.url()

  expect(url).toMatch(/accounts\.google\.com/)
})

test('when logged in, shows logout button', async () => {
  await page.login()

  const text = await page.$eval('a[href="/auth/logout"]', el => el.innerHTML)

  expect(text).toEqual('Logout')
})

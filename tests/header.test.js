const CustomPage = require('./helpers/Page')

let page

beforeEach(async () => {
  page = await CustomPage.build()

  await page.goto('http://localhost:3000')
})

afterEach(async () => {
  await page.close()
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

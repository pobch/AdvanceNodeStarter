const CustomPage = require('./helpers/Page')

let page

beforeEach(async () => {
  page = await CustomPage.build()
  await page.goto('http://localhost:3000')
})

afterEach(async () => {
  await page.close()
})

describe('When logged in', () => {
  beforeEach(async () => {
    await page.login()
    // click plus sign to add new blog
    await page.click('a.btn-floating')
  })

  test('can see Blog Create form', async () => {
    const label = await page.$eval('form label', el => el.innerHTML)
    expect(label).toEqual('Blog Title')
  })
})

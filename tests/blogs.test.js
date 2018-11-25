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

  describe('And using valid inputs', () => {
    beforeEach(async () => {
      await page.type('input[name="title"]', 'New Title')
      await page.type('input[name="content"]', 'New Content')
      await page.click('form button[type="submit"]')
    })

    test('submitting takes user to review screen', async () => {
      const text = await page.$eval('form h5', el => el.innerHTML)
      expect(text).toEqual('Please confirm your entries')
    })

    test('submitting then saving adds a new blog to index page', async () => {
      await page.click('button.green')
      await page.waitFor('.card-content')

      const title = await page.$eval('.card-content .card-title', el => el.innerHTML)
      const content = await page.$eval('.card-content p', el => el.innerHTML)
      expect(title).toEqual('New Title')
      expect(content).toEqual('New Content')
    })
  })

  describe('And using invalid inputs', () => {
    beforeEach(async () => {
      await page.click('form button[type="submit"]')
    })

    test('the form shows an error message', async () => {
      const textArr = await page.$$eval('.red-text', els => els.map(el => el.innerHTML))
      textArr.forEach(text => {
        expect(text).toEqual('You must provide a value')
      })
    })
  })
})

describe('When user is not logged in', () => {
  const actions = [
    {
      path: '/api/blogs',
      method: 'get'
    },
    {
      path: '/api/blogs',
      method: 'post',
      data: {
        title: 'T',
        content: 'C'
      }
    }
  ]

  test('all blog related apis are prohibited', async () => {
    const resArr = await page.execRequests(actions)

    for (let res of resArr) {
      expect(res).toEqual({ error: 'You must log in!' })
    }
  })

})

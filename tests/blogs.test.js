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

describe('When not logged in', () => {
  const fetchReqs = [
    {
      url: '/api/blogs',
      options: {
        method: 'GET',
        credentials: 'same-origin', // to send cookies with a req
        headers: {
          'Content-Type': 'application/json'
        }
      }
    },
    {
      url: '/api/blogs',
      options: {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'T',
          content: 'C'
        })
      }
    }
  ]

  test('all apis are restricted', async () => {
    const allRes = await page.evaluate(async (reqs) => {
      const resPromiseArr = reqs.map(async (req) => {
        const res = await fetch(req.url, req.options)
        return await res.json()
      })
      const resArr = await Promise.all(resPromiseArr)
      return resArr
    }, fetchReqs)

    expect(allRes).toEqual([{error: 'You must log in!'}, {error: 'You must log in!'}])
  })
  
})

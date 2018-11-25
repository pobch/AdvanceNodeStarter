const puppeteer = require('puppeteer')
const sessionFactory = require('../factories/sessionFactory')
const userFactory = require('../factories/userFactory')

class CustomPage {
  static async build() {
    const browser = await puppeteer.launch({
      headless: false
    })
    const page = await browser.newPage()
    const customPage = new CustomPage(page)

    return new Proxy(customPage, {
      get(target, property) {
        return customPage[property] || browser[property] || page[property]
      }
    })
  }
  
  constructor(pageObj) {
    this.page = pageObj
  }

  async login() {
    const userMongoObj = await userFactory()
    const { session, sig } = sessionFactory(userMongoObj)

    await this.page.setCookie({ name: 'session', value: session })
    await this.page.setCookie({ name: 'session.sig', value: sig })
    await this.page.goto('http://localhost:3000/blogs')
    await this.page.waitFor('a[href="/auth/logout"]')
  }

  // ----------- For api testing ----------------
  execRequests(actions) {
    const resPromiseArr = actions.map(({ path, method, data }) => {
      return this[method](path, data)
    })
    return Promise.all(resPromiseArr)
  }

  get(path) {
    return this.page.evaluate(_path => {
      return fetch(_path, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(res => res.json())
    }, path)
  }

  post(path, data) {
    return this.page.evaluate((_path, _data) => {
      return fetch(_path, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(_data)
      }).then(res => res.json())
    }, path, data)
  }

  // ------------ End of chunk ------------------
}

module.exports = CustomPage
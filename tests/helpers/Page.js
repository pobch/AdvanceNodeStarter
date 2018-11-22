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
}

module.exports = CustomPage
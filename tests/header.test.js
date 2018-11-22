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

test('display a log out button when an user logged in', async () => {
  const mongoose = require('mongoose')
  const Keygrip = require('keygrip')
  const keys = require('../config/keys')

  mongoose.Promise = global.Promise
  mongoose.connect(keys.mongoURI, { useMongoClient: true })
  const userSchema = new mongoose.Schema({
    googleId: String,
    displayName: String
  })
  mongoose.model('User', userSchema)
  const User = mongoose.model('User')
  const user = await new User({}).save()

  const sessionObj = {
    passport: {
      user: user._id.toString()
    }
  }
  const session = Buffer.from(JSON.stringify(sessionObj)).toString('base64')

  const keygrip = new Keygrip([keys.cookieKey])
  const sig = keygrip.sign('session=' + session)

  await page.setCookie({ name: 'session', value: session })
  await page.setCookie({ name: 'session.sig', value: sig })
  await page.goto('http://localhost:3000/blogs')
  await page.waitFor('a[href="/auth/logout"]')
  const text = await page.$eval('a[href="/auth/logout"]', el => el.innerHTML)

  expect(text).toEqual('Logout')
})

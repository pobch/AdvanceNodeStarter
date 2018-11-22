const Keygrip = require('keygrip')
const keys = require('../../config/keys')

const keygrip = new Keygrip([keys.cookieKey])

module.exports = (userMongoObj) => {
  const sessionObj = {
    passport: {
      user: userMongoObj._id.toString()
    }
  }
  const session = Buffer.from(JSON.stringify(sessionObj)).toString('base64')
  const sig = keygrip.sign('session=' + session)
  return {
    session,
    sig
  }
}

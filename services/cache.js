const mongoose = require('mongoose')
const redis = require('redis')
const util = require('util')

const redisUrl = 'redis://localhost:6379'
const client = redis.createClient(redisUrl)
client.get = util.promisify(client.get)

// save original exec()
const exec = mongoose.Query.prototype.exec

// create our custom exec()
// do not use arrow function because of `this` will be messed
mongoose.Query.prototype.exec = async function() {
  
  // Build a key to store in redis
  // Copy a returned obj of `.getQuery()` to a new obj, then add `collection` key/value
  const redisKey = JSON.stringify(
    Object.assign(
      {},
      this.getQuery(),
      { collection: this.mongooseCollection.name }
    )
  )

  const cachedValue = await client.get(redisKey)

  if (cachedValue) {
    // Found in redis
    const doc = JSON.parse(cachedValue) // can be an obj or an array of objs
    // Transform to a Mongoose Model obj or an array of Mongoose Model objs
    // async function auto return Promise
    return Array.isArray(doc)
      ? doc.map( d => new this.model(d))
      : new this.model(doc)
  }

  // Not found in redis, send a query to MongoDB
  const result =  await exec.apply(this, arguments) // the result is Mongoose Model obj, not JSON
  // Cache to redis
  client.set(redisKey, JSON.stringify(result))
  // The original exec() expected return is a Promise that can be resolved to a Mongoose Model obj
  //   or an array of Mongoose Model objs
  return result // async function auto return Promise
}
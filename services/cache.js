const mongoose = require('mongoose')
const redis = require('redis')
const util = require('util')

const redisUrl = 'redis://localhost:6379'
const client = redis.createClient(redisUrl)
client.hget = util.promisify(client.hget)

// save original exec()
const exec = mongoose.Query.prototype.exec

// create a new method for caching logics
mongoose.Query.prototype.cache = function(options = {}) {
  // use hash key for invalidate cache
  this.hashKey = JSON.stringify(options.redisHashKey || '')
  // to tell exec() that we want to cache
  this.useCache = true
  // to let this method can be chained
  return this
}

// create our custom exec()
// do not use arrow function because of `this` will be messed
mongoose.Query.prototype.exec = async function() {
  if (!this.useCache) {
    // when there is no .cache() in the query chain, do not implement caching
    return exec.apply(this, arguments)
  }

  // when there is .cache(), implement caching

  // Build a key to store in redis
  // Copy a returned obj of `.getQuery()` to a new obj, then add `collection` key/value
  const redisNestedKey = JSON.stringify(
    Object.assign(
      {},
      this.getQuery(),
      { collection: this.mongooseCollection.name }
    )
  )

  const cachedValue = await client.hget(this.hashKey, redisNestedKey)

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
  client.hset(this.hashKey, redisNestedKey, JSON.stringify(result))
  // The original exec() expected return is a Promise that can be resolved to a Mongoose Model obj
  //   or an array of Mongoose Model objs
  return result // async function auto return Promise
}
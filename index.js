const {send} = require('micro')
const getMatches = require('livesoccertv-parser')
const requestIp = require('request-ip')
const isIp = require('is-ip')
const geoIp = require('@pablopunk/geo-ip')

const getFolderFromUrl = (url, index) => url.split('/')[index]
const getCountryFromUrl = url => getFolderFromUrl(url, 1)
const getTeamFromUrl = url => getFolderFromUrl(url, 2)

let cache = {}
const cacheItemLife = 1000 * 60 * 24 // 1 day
const cacheLife = 1000 * 60 * 24 * 7 // 1 week

const filterProxy = req => {
  delete req.headers['x-forwarded-for']
  delete req.headers['x-real-ip']
  delete req.headers['x-zeit-co-forwarded-for']
  return req
}

const defaultTimezone = 'Europe/Madrid'

module.exports = async (req, res) => {
  const [country, team] = [getCountryFromUrl(req.url), getTeamFromUrl(req.url)]

  let headersSent = false

  if (!country || !team) {
    send(res, 404, 'Not found')
    return
  }

  const ip = requestIp.getClientIp(req).split(':').pop()
  let timezone = defaultTimezone

  if (isIp.v4(ip)) {
    // If a user uses a proxy, I want them to get the data
    // with the proxy IP, not their own
    req = filterProxy(req)
    timezone = geoIp({ip}).timezone
  }

  if (!cacheExists(country, team, timezone)) {
    await populateCache(country, team, timezone)
      .catch(err => {
        console.log('Error populating', err.message)
        send(res, 404, 'Not found')
        headersSent = true
      })
    setInterval(() => populateCache(country, team, timezone), cacheItemLife)
  }

  if (!headersSent) {
    send(res, 200, {matches: cache[country][team][timezone]})
  }
}

function cacheExists(country, team, timezone) {
  if (cache[country] && cache[country][team] && cache[country][timezone]) {
    return cache[country][team][timezone].length > 0
  }

  return false
}

async function populateCache(country, team, timezone) {
  console.log(`Populating ${country}/${team}`)

  if (!cache[country]) {
    cache[country] = {}
  }

  if (!cache[country][team]) {
    cache[country][team] = {}
  }

  cache[country][team][timezone] = await getMatches(country, team, {timezone})
}

setTimeout(() => {
  cache = {}
}, cacheLife)

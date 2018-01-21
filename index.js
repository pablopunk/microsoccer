const {parse} = require('url')
const {send} = require('micro')
const getMatches = require('livesoccertv-parser')

const getFolderFromUrl = (url, index) =>
  url
    .split('?')[0]
    .split('/')[index]
const getCountryFromUrl = url => getFolderFromUrl(url, 1)
const getTeamFromUrl = url => getFolderFromUrl(url, 2)

let cache = {}
const cacheItemLife = 1000 * 60 * 24 // 1 day
const cacheLife = 1000 * 60 * 24 * 7 // 1 week

const defaultTimezone = 'Europe/Madrid'

module.exports = async (req, res) => {
  const [country, team] = [getCountryFromUrl(req.url), getTeamFromUrl(req.url)]

  let headersSent = false

  if (!country || !team) {
    send(res, 404, 'Not found')
    return
  }

  // Get timezone from ?timezone or use default
  let timezone = defaultTimezone
  const {query} = parse(req.url, true)
  if (query && query.timezone) {
    timezone = query.timezone
  }

  if (!cache[country] || !cache[country][team] || !cache[country][team][timezone]) {
    await populateCache(country, team, timezone)
      .catch(err => {
        console.log('Error populating', err.message)
        send(res, 404, 'Not found')
        headersSent = true
      })

    if (!headersSent) {
      // Reload item cache periodically
      setInterval(() => populateCache(country, team, timezone), cacheItemLife)
    }
  }

  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')

  if (!headersSent) {
    send(res, 200, {matches: cache[country][team][timezone]})
  }
}

async function populateCache (country, team, timezone) {
  console.log(`Populating ${country}/${team} [${timezone}]`)
  if (!cache[country]) {
    cache[country] = {}
  }
  if (!cache[country][team]) {
    cache[country][team] = {}
  }
  cache[country][team][timezone] = await getMatches(country, team, {timezone})
}

// Reset cache completely periodically
setTimeout(() => {
  cache = {}
}, cacheLife)

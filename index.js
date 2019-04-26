const {parse} = require('url')
const {send} = require('micro')
const getMatches = require('livesoccertv-parser')
const ms = require('ms')

const getFolderFromUrl = (url, index) =>
  url
    .split('?')[0]
    .split('/')[index]
const getCountryFromUrl = url => getFolderFromUrl(url, 1)
const getTeamFromUrl = url => getFolderFromUrl(url, 2)

let cache = {}
// If an item is in the cache, it will update every 5 minutes
const cacheItemLife = ms('5m')
// Reset cache every day
const cacheLife = ms('1d')

const defaultTimezone = 'Europe/Paris'

const getDataFromUrl = (url) => {
  const country = getCountryFromUrl(url)
  const team = getTeamFromUrl(url)

  let timezone = defaultTimezone
  const {query} = parse(url, true)

  if (query && query.timezone) {
    timezone = query.timezone
  }

  return { country, team, timezone }
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')

  const { url } = req
  const { country, team, timezone } = getDataFromUrl(url)

  if (
    url === '/favicon.ico' ||
    url === '' ||
    url === '/' ||
    !country ||
    !team) {

    send(res, 404, 'Not found')
    return
  }

  if (cache[url]) {
    send(res, 200, {matches: cache[req.url]})
    return
  }

  await populateCache({ url, country, team, timezone })
    .then(_ => {
      send(res, 200, {matches: cache[url]})
      setInterval(() => populateCache(country, team, timezone), cacheItemLife)
    })
    .catch(err => {
      console.log('Error populating', err.message)
      send(res, 404, 'Not found')
    })
}

async function populateCache ({ url, country, team, timezone }) {
  console.log(`Populating ${url}`)
  cache[url] = await getMatches(country, team, {timezone})
}

// Reset cache completely periodically
setTimeout(() => {
  cache = {}
}, cacheLife)

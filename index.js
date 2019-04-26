const {parse} = require('url')
const {send} = require('micro')
const getMatches = require('livesoccertv-parser')
const ms = require('ms')
const Cache = require('cache')

const cache = new Cache(ms('5m')) // 5 minutes cache

const defaultTimezone = 'Europe/Paris'

const getFolderFromUrl = (url, index) =>
  url
    .split('?')[0]
    .split('/')[index]

const getCountryFromUrl = url => getFolderFromUrl(url, 1)

const getTeamFromUrl = url => getFolderFromUrl(url, 2)

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

async function populateCache ({ url, country, team, timezone }) {
  console.log(`Populating ${url}`)
  cache.put(url, await getMatches(country, team, {timezone}))
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

  const cached = cache.get(url)
  if (cached) {
    return {matches: cached}
  }

  await populateCache({ url, country, team, timezone })
    .then(_ => {
      send(res, 200, {matches: cache.get(url)})
    })
    .catch(err => {
      console.log('Error populating', err.message)
      send(res, 404, 'Not found')
    })
}

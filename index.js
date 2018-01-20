const {send} = require('micro')
const getMatches = require('livesoccertv-parser')
const requestIp = require('request-ip')
const isIp = require('is-ip')
const pify = require('pify')
const satelize = pify(require('satelize').satelize)

const getFolderFromUrl = (url, index) => url.split('/')[index]
const getCountryFromUrl = url => getFolderFromUrl(url, 1)
const getTeamFromUrl = url => getFolderFromUrl(url, 2)

const cache = {}
const cacheLife = 1000 * 60 * 24 // 1 day

module.exports = async (req, res) => {
  const [country, team] = [getCountryFromUrl(req.url), getTeamFromUrl(req.url)]

  let headersSent = false

  if (!country || !team) {
    send(res, 404, 'Not found')
    return
  }

  const ip = requestIp.getClientIp(req).split(':').pop()
  let timezone = 'Europe/Madrid'

  if (isIp.v4(ip)) {
    timezone = (await satelize({ ip })).timezone
  }

  if (!cache[country] || !cache[country][team]) {
    await populateCache(country, team, timezone)
      .catch(err => {
        console.log(err.message)
        send(res, 404, 'Not found')
        headersSent = true
      })
    setInterval(() => populateCache(country, team, timezone), cacheLife)
  }

  if (!headersSent) {
    send(res, 200, {matches: cache[country][team]})
  }
}

async function populateCache (country, team, timezone) {
  console.log(`Populating ${country}/${team}`)
  cache[country] = {}
  cache[country][team] = await getMatches(country, team, {timezone})
}

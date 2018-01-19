const {send} = require('micro')
const getMatches = require('livesoccertv-parser')

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

  if (!cache[country] || !cache[country][team]) {
    await populateCache(country, team)
      .catch(err => {
        console.log(err.message)
        send(res, 404, 'Not found')
        headersSent = true
      })
    setInterval(() => populateCache(country, team), cacheLife)
  }

  if (!headersSent) {
    send(res, 200, {matches: cache[country][team]})
  }
}

async function populateCache(country, team) {
  console.log(`Populating ${country}/${team}`)
  cache[country] = {}
  cache[country][team] = await getMatches(country, team)
}

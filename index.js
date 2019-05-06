const { parse: urlParse } = require('url')
const Koa = require('koa')
const cache = require('koa-incache')
const cors = require('@koa/cors')
const getMatches = require('livesoccertv-parser')

const app = new Koa()

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

  const { query } = urlParse(url, true)

  if (query && query.timezone) {
    timezone = query.timezone
  }

  return { country, team, timezone }
}

const validDomains = [ 'https://tvrealmadrid.com', 'https://tvarsenal.com' ]

if (typeof process.env.ACCEPT === 'string') {
  validDomains.push(process.env.ACCEPT)
}

app.use(cors({
  origin (ctx) {
    if (validDomains.includes(ctx.request.header.origin)) {
      return ctx.request.header.origin
    }
    return validDomains[0]
  }
}))

app.use(cors({
  origin () { return '*' } }))

app.use(cache({maxAge: 1 * 60 * 1000})) // 1 minute cache

app.use(async (ctx, next) => {
  if (ctx.path.includes('favicon')) {
    ctx.throw(404)
  } else if (ctx.path === '') {
    ctx.throw(404)
  } else if (ctx.path === '/') {
    ctx.throw(404)
  } else {
    await next()
  }
})

app.use(async ctx => {
  const { country, team, timezone } = getDataFromUrl(ctx.url)
  if (!country || !team || !timezone) {
    ctx.throw(404)
    return
  }
  const matches = await getMatches(country, team, {timezone})

  ctx.cached({matches})
  ctx.body = {matches}
})

if (process.env.NODE_ENV === 'development') {
  const port = process.env.PORT || 3000
  app.listen(port)
  console.log('Listening on', port)
}

module.exports = app.callback()

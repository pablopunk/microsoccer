# microsoccer

<p align="center">
  <a href="https://travis-ci.org/pablopunk/microsoccer"><img src="https://img.shields.io/travis/pablopunk/microsoccer.svg" /> </a>
  <a href="https://github.com/sindresorhus/xo"><img src="https://img.shields.io/badge/code_style-XO-5ed9c7.svg" /> </a>
  <a href="https://github.com/pablopunk/miny"><img src="https://img.shields.io/badge/made_with-miny-1eced8.svg" /> </a>
  <a href="https://www.npmjs.com/package/microsoccer"><img src="https://img.shields.io/npm/dt/microsoccer.svg" /></a>
</p>

<p align="center">
  <i>Microservice to fetch soccer matches info and tv channels</i>
</p>

## Usage

```sh
npm start
```

That's it! Now you have a microservice listening on port 3000


## API

Get a list of Real Madrid's recent games as well as the next matches.

`GET /spain/real-madrid`

Get a list of Arsenal's games with UK's time zone. Default timezone is `Europe/Madrid`.

`GET /england/arsenal?timezone=Europe/London`


## Related

* [tvrealmadrid.com](https://github.com/pablopunk/tvrealmadrid.com): See next matches for Real Madrid
* [livesoccertv-parser](https://github.com/pablopunk/livesoccertv-parser): Fetch matches info with node

## License

MIT


## Author

| ![me](https://gravatar.com/avatar/fa50aeff0ddd6e63273a068b04353d9d?size=100)           |
| --------------------------------- |
| [Pablo Varela](https://pablo.life)   |


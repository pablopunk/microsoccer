const { send } = require('micro');
const getMatches = require('livesoccertv-parser');

const getFolderFromUrl = (url, index) => url.split('/')[index];
const getCountryFromUrl = url => getFolderFromUrl(url, 1);
const getTeamFromUrl = url => getFolderFromUrl(url, 2);

module.exports = async (req, res) => {
  const [country, team] = [getCountryFromUrl(req.url), getTeamFromUrl(req.url)];
  if (!country || !team) {
    send(res, 404, 'Not found');
    return;
  }
  getMatches(country, team)
    .then(matches => send(res, 200, { matches }))
    .catch(() => send(res, 404, 'Not found'));
};

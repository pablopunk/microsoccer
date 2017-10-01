const test = require('ava');
const micro = require('micro');
const { get } = require('got');
const listen = require('test-listen');
const m = require('..');

const server = micro(m);

const simpleTeamTest = async (t, country, team) => {
  const url = await listen(server);
  const result = await get(`${url}/${country}/${team}`);
  const data = JSON.parse(result.body);
  t.is(result.statusCode, 200);
  return data.matches;
};

test('Fetch real madrid matches', async t => {
  const matches = await simpleTeamTest(t, 'spain', 'real-madrid');
  t.true(Array.isArray(matches));
});

test('Fetch barcelona matches', async t => {
  const matches = await simpleTeamTest(t, 'spain', 'barcelona');
  t.true(Array.isArray(matches));
});

test('Fetch invalid team', async t => {
  const matches = await simpleTeamTest(t, 'spain', 'foo');
  t.is(matches.length, 0);
});

test('Fetch 404', async t => {
  const url = await listen(server);
  await get(url).catch(err => t.is(err.statusCode, 404));
});

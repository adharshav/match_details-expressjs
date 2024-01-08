const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at 3000')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
  }
}
initializeDBAndServer()

const convertDbToObjectAPI1 = objectItem => {
  return {
    playerId: objectItem.player_id,
    playerName: objectItem.player_name,
  }
}

//Get List of Players in Player Table
app.get('/players/', async (request, response) => {
  const getPlayersListQuery = `
    SELECT *
    FROM 
    player_details`

  const getPlayersListQueryResponse = await db.all(getPlayersListQuery)
  response.send(
    getPlayersListQueryResponse.map(eachItem =>
      convertDbToObjectAPI1(eachItem),
    ),
  )
})

//Get Specific player Based on player ID
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerByIdQuery = `
    SELECT * 
    FROM 
    player_details 
    WHERE 
    player_id = ${playerId}`

  const getPlayerByIdQueryResponse = await db.get(getPlayerByIdQuery)
  response.send(convertDbToObjectAPI1(getPlayerByIdQueryResponse))
})

//Update Player details of a specific player based on ID
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body
  const updatePlayerDetailsByIdQuery = `
  UPDATE 
  player_details 
  SET 
  player_name = '${playerName}'
  WHERE 
  player_id = ${playerId}`

  await db.run(updatePlayerDetailsByIdQuery)
  response.send('Player Details Updated')
})

const convertDbToObjectAPI4 = objectItem => {
  return {
    matchId: objectItem.match_id,
    match: objectItem.match,
    year: objectItem.year,
  }
}

//Get Match details of a specific Match
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getMatchByIdQuery = `
    SELECT * 
    FROM 
    match_details 
    WHERE 
    match_id = ${matchId}`

  const getMatchByIdQueryResponse = await db.get(getMatchByIdQuery)
  response.send(convertDbToObjectAPI4(getMatchByIdQueryResponse))
})

//Get list of matches of a player
app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params

  const getPlayerMatchQuery = `
  SELECT *  
  FROM 
  player_match_score 
  NATURAL JOIN match_details
  WHERE 
  player_id = ${playerId}`
  const getPlayerMatches = await db.all(getPlayerMatchQuery)
  response.send(
    getPlayerMatches.map(eachMatch => convertDbToObjectAPI4(eachMatch)),
  )
})

//Get list of players of a specific match
app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params

  const getMatchPlayerQuery = `
  SELECT *  
  FROM 
  player_match_score 
  NATURAL JOIN player_details
  WHERE 
  match_id = ${matchId}`

  const getMatchPlayers = await db.all(getMatchPlayerQuery)
  response.send(
    getMatchPlayers.map(eachMatch => convertDbToObjectAPI1(eachMatch)),
  )
})

//Get stats of a specific player based on the player ID
app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params

  const getStatsQuery = `
  SELECT 
  player_details.player_id AS playerId, 
  player_name AS playerName, 
  SUM(score) AS totalScore, 
  SUM(fours) AS totalFours,
  SUM(sixes) AS totalSixes 
  FROM 
  player_details INNER JOIN player_match_score 
  ON player_details.player_id = player_match_score.player_id
  WHERE player_details.player_id = ${playerId}`

  const getStatsQueryResponse = await db.get(getStatsQuery)
  response.send(getStatsQueryResponse)
})

module.exports = app
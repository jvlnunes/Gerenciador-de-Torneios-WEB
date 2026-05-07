const express = require('express')
const router  = express.Router()
const pool    = require('../config/db')
const auth    = require('../middlewares/auth.middleware')

/* ─── formatters ──────────────────────────────────────────── */
const fmtTeam = r => ({
  id:           r.id,
  tournamentId: r.tournament_id,
  name:         r.name,
  logoUrl:      r.logo_url,
  inviteToken:  r.invite_token,
  playerCount:  Number(r.player_count ?? 0),
  createdAt:    r.created_at,
})

const fmtPlayer = r => ({
  id:            r.id,
  teamId:        r.team_id,
  userId:        r.user_id,
  name:          r.name,
  jerseyNumber:  r.jersey_number,
  position:      r.position,
  photoUrl:      r.photo_url,
  joinedViaLink: r.joined_via_link,
  createdAt:     r.created_at,
})

/* ═══════════════════════════════════════════════════════════ */
/*  TIMES                                                       */
/* ═══════════════════════════════════════════════════════════ */

// GET /teams?tournamentId=xxx
router.get('/', async (req, res) => {
  const { tournamentId } = req.query
  if (!tournamentId)
    return res.status(400).json({ error: 'Parâmetro tournamentId é obrigatório' })
  try {
    const { rows } = await pool.query(
      `SELECT t.*, COUNT(p.id) AS player_count
         FROM teams t
         LEFT JOIN players p ON p.team_id = t.id
        WHERE t.tournament_id = $1
        GROUP BY t.id ORDER BY t.created_at ASC`,
      [tournamentId]
    )
    res.json(rows.map(fmtTeam))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET /teams/join/:token  — preview público para a tela de convite
router.get('/join/:token', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.*, tr.name AS tournament_name, COUNT(p.id) AS player_count
         FROM teams t
         JOIN tournaments tr ON tr.id = t.tournament_id
         LEFT JOIN players p ON p.team_id = t.id
        WHERE t.invite_token = $1
        GROUP BY t.id, tr.name`,
      [req.params.token]
    )
    if (!rows.length) return res.status(404).json({ error: 'Link de convite inválido' })
    res.json({ ...fmtTeam(rows[0]), tournamentName: rows[0].tournament_name })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET /teams/:id — detalhe com jogadores
router.get('/:id', async (req, res) => {
  try {
    const { rows: t } = await pool.query('SELECT * FROM teams WHERE id=$1', [req.params.id])
    if (!t.length) return res.status(404).json({ error: 'Time não encontrado' })
    const { rows: p } = await pool.query(
      'SELECT * FROM players WHERE team_id=$1 ORDER BY jersey_number ASC NULLS LAST',
      [req.params.id]
    )
    res.json({ ...fmtTeam(t[0]), players: p.map(fmtPlayer) })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST /teams
router.post('/', auth, async (req, res) => {
  const { tournamentId, name, logoUrl } = req.body
  if (!tournamentId || !name)
    return res.status(400).json({ error: 'tournamentId e name são obrigatórios' })
  try {
    const { rows } = await pool.query(
      `INSERT INTO teams (tournament_id, name, logo_url) VALUES ($1,$2,$3) RETURNING *`,
      [tournamentId, name, logoUrl ?? null]
    )
    res.status(201).json(fmtTeam(rows[0]))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// PUT /teams/:id
router.put('/:id', auth, async (req, res) => {
  const { name, logoUrl } = req.body
  try {
    const { rows } = await pool.query(
      `UPDATE teams SET name=COALESCE($1,name), logo_url=COALESCE($2,logo_url), updated_at=NOW()
        WHERE id=$3 RETURNING *`,
      [name ?? null, logoUrl ?? null, req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Time não encontrado' })
    res.json(fmtTeam(rows[0]))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST /teams/:id/regenerate-invite
router.post('/:id/regenerate-invite', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE teams SET invite_token=encode(gen_random_bytes(32),'hex') WHERE id=$1 RETURNING *`,
      [req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Time não encontrado' })
    res.json(fmtTeam(rows[0]))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// DELETE /teams/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM teams WHERE id=$1', [req.params.id])
    res.status(204).send()
  } catch (e) { res.status(500).json({ error: e.message }) }
})

/* ═══════════════════════════════════════════════════════════ */
/*  JOGADORES                                                   */
/* ═══════════════════════════════════════════════════════════ */

// GET /teams/:teamId/players
router.get('/:teamId/players', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM players WHERE team_id=$1 ORDER BY jersey_number ASC NULLS LAST',
      [req.params.teamId]
    )
    res.json(rows.map(fmtPlayer))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST /teams/:teamId/players — adicionar manualmente
router.post('/:teamId/players', auth, async (req, res) => {
  const { name, jerseyNumber, position } = req.body
  if (!name) return res.status(400).json({ error: 'name é obrigatório' })
  try {
    const { rows } = await pool.query(
      `INSERT INTO players (team_id, name, jersey_number, position)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.teamId, name, jerseyNumber ?? null, position ?? null]
    )
    res.status(201).json(fmtPlayer(rows[0]))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST /teams/join/:token/players — jogador entra pelo link (requer auth)
router.post('/join/:token/players', auth, async (req, res) => {
  try {
    const { rows: t } = await pool.query(
      'SELECT * FROM teams WHERE invite_token=$1', [req.params.token]
    )
    if (!t.length) return res.status(404).json({ error: 'Link de convite inválido' })
    const { name, jerseyNumber, position } = req.body
    const { rows } = await pool.query(
      `INSERT INTO players (team_id, user_id, name, jersey_number, position, joined_via_link)
       VALUES ($1,$2,$3,$4,$5,true) RETURNING *`,
      [t[0].id, req.user.id, name || req.user.name, jerseyNumber ?? null, position ?? null]
    )
    res.status(201).json(fmtPlayer(rows[0]))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// PUT /teams/:teamId/players/:playerId
router.put('/:teamId/players/:playerId', auth, async (req, res) => {
  const { name, jerseyNumber, position } = req.body
  try {
    const { rows } = await pool.query(
      `UPDATE players SET
         name=COALESCE($1,name), jersey_number=COALESCE($2,jersey_number), position=COALESCE($3,position)
       WHERE id=$4 AND team_id=$5 RETURNING *`,
      [name ?? null, jerseyNumber ?? null, position ?? null, req.params.playerId, req.params.teamId]
    )
    if (!rows.length) return res.status(404).json({ error: 'Jogador não encontrado' })
    res.json(fmtPlayer(rows[0]))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// DELETE /teams/:teamId/players/:playerId
router.delete('/:teamId/players/:playerId', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM players WHERE id=$1 AND team_id=$2',
      [req.params.playerId, req.params.teamId])
    res.status(204).send()
  } catch (e) { res.status(500).json({ error: e.message }) }
})

module.exports = router
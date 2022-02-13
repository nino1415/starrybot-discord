'use strict';

const db = require("./db")
const logger = require("./logger")
const discord = require("./discord") // this should be the only place this is brought in
const logic = require("./logic")

const express = require('express')
const cors = require('cors')
const app = express()
app.use(express.static('public'))

app.use(cors())

app.enable('trust proxy')
app.use(express.urlencoded({extended: false}))
app.use(express.json())
app.use((req, res, next) => {
	res.set('Content-Type', 'text/html')
	next()
})

app.post('/starry-backend', async (req, res) => {
	logger.log("express::starry-backend hit")
	logger.log('req.body', req.body)
	try {
		let results = await logic.hoistInquire(req.body.traveller)
		res.status(200).send(results)
	} catch (err) {
		logger.warn('Error hitting starry-backend', err)
		res.status(400).send({error:"Error hitting back end"})
	}
})

app.post('/keplr-signed', async (req, res) => {
	logger.log("express::keplr-signed hit")
	logger.log('req.body', req.body)
	try {
		let results = await logic.hoistFinalize(req.body, discord.client)
		res.status(results.error ? 400 : 200).send(results)
	} catch (err) {
		logger.warn('Error hitting kelpr-signed', err)
		res.status(400).send({error:"error"})
	}
})

app.get('/health-check', async (req, res) => {
	res.status(200).send()
})

// TODO arguably config could be separate from db so that db would not need to be included here
const PORT = db.myConfig.PORT || process.env.PORT || 80;
const server = app.listen(PORT, () => {
	logger.info(`App listening on port ${PORT}`)
})

module.exports = server

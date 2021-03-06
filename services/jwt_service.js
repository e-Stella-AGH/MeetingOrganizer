const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken')
const { Meeting } = require("../db/meeting")
const { models } = require('../db/relations')
const Organizer = models.Organizer
const env = process.env
const secret = "TOKEN_SECRET" in env ? env.TOKEN_SECRET : "TOKEN_SECRET"
const { IntegrationService } = require("../integration_config")


const sendMessage = (res, msg, status = 200) => res.status(status).send({ msg: msg })
const sendUnauthorized = (res) => sendMessage(res, "Unauthorized", 401)
const sendNotFound = (res) => sendMessage(res, "Not Found", 404)
const sendForbidden = (res) => sendMessage(res, "Forbidden", 403)
const sendIntegrationUnauthorized = (res) => sendMessage(res, "Integration service response unauthorized", 401)

const Authorize = {
    generateAccessToken: (organizer) => jwt.sign({ id: organizer.id, email: organizer.email }, secret),

    hashPassword: async (password) => {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    },

    checkPassword: async (password, user) => await bcrypt.compare(password, user.password),

    findOrganizerWithEmail: async (email) => {
        const organizers = await Organizer.findAll({ where: { email: email } })
        return organizers.length === 0 ? null : organizers[0]
    },

    getEmailFromIntegrationToken: async (req, res, next) => {
        const token = req.headers['authorization']

        const integrationResult = await IntegrationService.verifyToken(token)
        if (integrationResult === null) return sendIntegrationUnauthorized(res)
        req.userEmail = integrationResult
        next()
    },

    authenticateToken: async (req, res, next) => {
        const token = req.headers['authorization']
        if (token == null) return sendUnauthorized(res)


        const integrationResult = await IntegrationService.verifyToken(token)

        if (integrationResult !== null && integrationResult !== undefined) {
            const email = integrationResult
            const organizer = await Authorize.findOrganizerWithEmail(email)
            if (organizer === null) return sendIntegrationUnauthorized(res)

            req.user = organizer
            next()
        } else
            jwt.verify(token, secret, async (err, user) => {
                if (err || !user) return sendUnauthorized(res)
                const organizer = await Organizer.findByPk(user.id)
                if (!organizer) return sendUnauthorized(res)
                req.user = organizer

                next()
            })

    },

    verifyToken: (token, func) => jwt.verify(token, secret, func),

    isMeetingOrganizer: async (req, res, next) => {
        const meetingUuid = req.params.meeting_uuid
        const meeting = await Meeting.findByPk(meetingUuid)
        if (!meeting) return sendNotFound(res)
        const organizer = await meeting.getOrganizer()

        if (organizer.id !== req.user.id) return sendForbidden(res)

        req.meeting = meeting

        next()
    }

}

exports.Authorize = Authorize
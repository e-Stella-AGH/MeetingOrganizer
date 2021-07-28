const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const { Meeting } = require("../db/meeting");
const { models } = require('../db/relations')
const Organizer = models.Organizer
const env = process.env
const secret = "TOKEN_SECRET" in env ? env.TOKEN_SECRET : "TOKEN_SECRET"



const Authorize = {
    generateAccessToken: (organizer) => jwt.sign({id: organizer.id, email: organizer.email}, secret),

    hashPassword: async (password) => {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    },

    checkPassword: async (password,user) => await bcrypt.compare(password, user.password),

    authenticateToken: async (req, res, next) => {
        const token = req.headers['authorization']

        if (token == null) return res.sendStatus(401)

        jwt.verify(token, secret, async (err, user) => {
            if (err || !user) return res.sendStatus(401)            
            const organizer = await Organizer.findByPk(user.id)
            if(!organizer) return res.sendStatus(401)
            req.user = organizer

            next()
        })
    },

    verifyToken: (token, func) => jwt.verify(token,secret, func),

    isMeetingOrganizer: async(req,res,next) => {
        const meetingUuid = req.params.meeting_uuid
        const meeting = await Meeting.findByPk(meetingUuid)
        if(!meeting) return res.sendStatus(404)
        const organizer = await meeting.getOrganizer()

        if(organizer.id!==req.user.id) return res.sendStatus(403)

        req.meeting = meeting

        next()
    }

}

exports.Authorize = Authorize
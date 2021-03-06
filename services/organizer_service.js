const { models } = require('../db/relations')
const { Checker } = require('./data_checker')
const { Authorize } = require('./jwt_service')
const Organizer = models.Organizer
const { Responses } = require('../utils/responses')
const createResponse = Responses.createResponse

const invalidResponse = createResponse("Invalid login or password", 400)

const generateRandomString = () => Math.random().toString(36).slice(-8);

const organizerService = {
    register: async (email, password) => {
        const checkResult = Checker.checkEmail(email)
        if (checkResult !== true) return createResponse(checkResult, 400)

        const organizer = await Authorize.findOrganizerWithEmail(email)
        if (organizer !== null) return createResponse("This mail is already used", 400)

        const newPassword = await Authorize.hashPassword(password)
        await Organizer.create({ email: email, password: newPassword })
        return createResponse("Created user", 201)
    },

    login: async (email, password) => {
        const organizer = await Authorize.findOrganizerWithEmail(email)
        if (organizer === null) return invalidResponse

        return await Authorize.checkPassword(password, organizer)
            ? createResponse(Authorize.generateAccessToken(organizer))
            : invalidResponse
    },

    loginWithEmail: async (email) => {
        let organizer = await Authorize.findOrganizerWithEmail(email)
        if (organizer === null) await organizerService.register(email, generateRandomString())
    },

    updateOrganizer: async (organizer, password) => {
        const hashedPassword = await Authorize.hashPassword(password)
        organizer.password = hashedPassword
        await organizer.save()
        return createResponse("User updated")
    },

    getById: async (id) => await Organizer.findByPk(id)
}

exports.OrganizerService = organizerService
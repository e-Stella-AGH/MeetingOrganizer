const { models } = require('../db/relations')
const { Checker } = require('./data_checker')
const { Authorize } = require('./jwt_service')
const Organizer = models.Organizer
const { Responses } = require('../utils/responses')
const createResponse = Responses.createResponse

const invalidResponse = createResponse("Invalid login or password", 400)

const findOrganizerWithEmail = async (email) => await Organizer.findAll({ where: { email: email } })

const organizerService = {
    register: async (email, password) => {
        const checkResult = Checker.checkEmail(email) 
        if(checkResult!==true)return createResponse(checkResult,400)
        const newPassword = await Authorize.hashPassword(password)
        const organizers = await findOrganizerWithEmail(email)
        if(organizers.length!==0) return createResponse("This mail is already used",400) 
        await Organizer.create({ email: email, password: newPassword })
        return createResponse("Created user",201)
    },

    login: async (email, password) => {
        const organizers = await findOrganizerWithEmail(email)
        if (organizers.length===0) return invalidResponse
        const organizer = organizers[0]
        return await Authorize.checkPassword(password,organizer)
            ? createResponse(Authorize.generateAccessToken(organizer))
            : invalidResponse
    },

    updateOrganizer: async(organizer,password) => {
        const hashedPassword = await Authorize.hashPassword(password)
        
    },

    getById: async (id) => await Organizer.findByPk(id)
}

exports.organizerService = organizerService
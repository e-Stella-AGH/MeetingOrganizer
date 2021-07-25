const {models} = require('../db/relations')
const {Checker} = require('./data_checker')
const Organizer = models.Organizer

const organizerService = {
    register: async (email,password) => {

    },

    login: async (email,password) => {
        
    }
}

exports.organizerService = organizerService
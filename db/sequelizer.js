const {Sequelize} = require('sequelize')
const env = process.env
const dbUri = "POSTGTES" in env?env.POSTGRES:'sqlite::memory:'
const sequelize = new Sequelize(dbUri, {logging: false})


exports.sequelize = sequelize
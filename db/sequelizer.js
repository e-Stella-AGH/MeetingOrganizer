const { Sequelize } = require('sequelize')
const env = process.env
const dbUri = "DATABASE_URL" in env ? env.DATABASE_URL : 'sqlite::memory:'
const sequelize = new Sequelize(dbUri, { logging: false })


exports.sequelize = sequelize
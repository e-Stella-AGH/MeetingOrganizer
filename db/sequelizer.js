const { Sequelize } = require('sequelize')
const env = process.env
const isPostgres = "DATABASE_URL" in env
const dbUri = isPostgres ? env.DATABASE_URL : 'sqlite::memory:'
const options = isPostgres ? {
    dialect: "postgres",
    protocol: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
} : {}

const sequelize = new Sequelize(dbUri, { logging: false, ...options })


exports.sequelize = sequelize
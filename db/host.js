const {sequelize} = require("./sequelizer")
const { DataTypes, Sequelize } = require("sequelize")

const Host = sequelize.define("Host", {
    uuid: {
        type: DataTypes.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true    
    },
    email: {type: DataTypes.STRING, allowNull: false}
})

exports.Host = Host
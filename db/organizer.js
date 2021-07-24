const {sequelize} = require("./sequelizer")
const {DataTypes} =  require("sequelize")

console.log(sequelize)

const Organizer = sequelize.define("Organizer", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true    
    },
    email: {type: DataTypes.STRING, allowNull: false},
    password: {type: DataTypes.STRING,  allowNull: false},
})

exports.Organizer = Organizer


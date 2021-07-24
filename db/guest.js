const {sequelize} = require("./sequelizer")
const {DataTypes } = require("sequelize");


const Guest = sequelize.define("Guests", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true    
    },
    email: {type: DataTypes.STRING, allowNull: false}
}, { timestamps: false })

exports.Guest = Guest


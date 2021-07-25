const {sequelize} = require("./sequelizer")
const {DataTypes } = require("sequelize");


const Guest = sequelize.define("Guests", {
    email: {type: DataTypes.STRING, primaryKey: true}
}, { timestamps: false })

exports.Guest = Guest


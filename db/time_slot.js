const {sequelize} = require("./sequelizer")
const { DataTypes } = require("sequelize")

const TimeSlot = sequelize.define("TimeSlot", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true    
    },
    startDatetime: {type: DataTypes.DATE, allowNull:false},
    duration: {type: DataTypes.INTEGER, allowNull:false}
})

exports.TimeSlot = TimeSlot 
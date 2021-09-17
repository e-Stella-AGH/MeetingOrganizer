
const { Host } = require('../db/host')
const { TimeSlot } = require('../db/time_slot')
const { RestUtils } = require('../utils/rest_utils')
const { Checker } = require('./data_checker')

Host.timeSlots = Host.hasMany(TimeSlot);

const hostService = {
    getHostWithTimeSlots: async (uuid) => {
        const host = await Host.findOne({
            where: {
                uuid: uuid
            },
            include: TimeSlot
        })
        return { ...RestUtils.createResponse("Hosts time slots"), host: host }
    },

    updateHostsTimeSlots: async (uuid, timeSlots) => {
        if (timeSlots.some(slot => Checker.checkTimeSlot(slot) !== true)) {
            return RestUtils.createResponse(`Cannot set timeSlots in the past!`, RestUtils.BAD_REQUEST_CODE)
        }
        TimeSlot.destroy({
            where: {
                HostUuid: uuid
            }
        }).then(async _ => {
            for (const timeSlot of timeSlots) {
                await TimeSlot.create({
                    startDatetime: timeSlot.startDatetime,
                    duration: timeSlot.duration,
                    HostUuid: uuid
                })
            }
        })
        return RestUtils.createResponse("Host time slots updated")
    },

    hostExist: async (req, res, next) => {
        const uuid = req.params.uuid
        const countAll = await Host.findAndCountAll({ where: { uuid: uuid } })
        if (countAll === 0) return res.status(404).send("User with this uuid not found")
        next()
    }
}


exports.HostService = hostService
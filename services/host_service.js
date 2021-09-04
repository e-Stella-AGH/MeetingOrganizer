
const { Host } = require('../db/host')
const { TimeSlot } = require('../db/time_slot')
const { RestUtils } = require('../utils/rest_utils')
const { Checker } = require('./data_checker')

Host.timeSlots = Host.hasMany(TimeSlot);

const hostService = {
    getHostWithTimeSlots: async (uuid) => {
        const host = await Host.findOne({
            attributes: ['email'],
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
    }
}


exports.HostService = hostService
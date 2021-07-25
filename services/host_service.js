const {Host} = require('../db/host')
const {TimeSlot} = require('../db/time_slot')

Host.timeSlots = Host.hasMany(TimeSlot);

function createHost() {
    return Host.create({
        email: "andrzej@duda.pl",
        TimeSlots: [{
            startDatetime: Date(),
            duration: 45
        }]
    }, {
        include: [{
            association: Host.timeSlots,
        }
        ]
    })
}


function getHostWithTimeSlots(uuid) {
        return Host.findAll({
            attributes: ['email'],
            where: {
                uuid: uuid
            },
            include: TimeSlot
        })

}

async function updateHostsTimeSlots(uuid, request) {
    TimeSlot.destroy({
        where: {
            HostUuid: uuid
        }
    }).then(async r => {
        for (const timeSlot of request.timeSlots) {
            await TimeSlot.create({
                startDatetime: timeSlot.startDatetime,
                duration: timeSlot.duration,
                HostUuid: uuid
            })
        }

    })

}

exports.updateHostsTimeSlots = (uuid, request) => updateHostsTimeSlots(uuid, request)
exports.getHostWithTimeSlots = (uuid) => getHostWithTimeSlots(uuid)
exports.createHost = () => createHost()
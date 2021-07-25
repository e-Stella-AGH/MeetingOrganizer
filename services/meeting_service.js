const {Guest} = require('../db/guest')
const {Meeting} = require('../db/meeting')
const {TimeSlot} = require('../db/time_slot')
const {Host} = require('../db/host')
const {HostService} = require('../services/host_service')

Meeting.hosts = Meeting.belongsToMany(Host, {through: "MeetingHost"})
Host.timeSlots = Host.hasMany(TimeSlot)


function getTimeSlotsIntersection(uuid) {
    return Meeting.findOne({
        where: {
            uuid: uuid
        },
        include: {
            model: Host
        }
    }).then(meeting => {
        let slots = []
        meeting.hosts().forEach(host => {
            HostService.getHostWithTimeSlots(host.uuid)
                .then(h => {
                    slots.push(h.timeSlots)
                })
        })
        slots.forEach(s => s.sort((a, b) => a.startDatetime < b.startDatetime))
        return getIntersection(slots)
    })
}

    function getIntersection(slots) {
        let res = []
        let pointers = new Array(slots.length).fill(0)
        while (pointers.every(el => el < slots[pointers.indexOf(el) - 1].length)) {
            let it_slots = new Array(slots.length).fill(0)
            for (let i = 0; i < slots.length; i++) {
                it_slots[i] = slots[i][pointers[i]]
            }
            let vals = new Array(slots.length).fill(0)
            vals = it_slots.map(slot => slot.startDatetime.getTime())
            let l = Math.max(vals)

            vals = it_slots.map(slot => slot.startDatetime.getTime() + slot.duration * 60000)
            let r = Math.min(vals)

            if (l + 15 <= r) {
                res.push({startDatetime: new Date(l), duration: (new Date(r) - new Date(l)) / 60000})
            }

            pointers[vals.indexOf(r)]++
        }
        return res
    }

    function pickTimeSlot(uuid, req) {
        Meeting.update({startTime: req.startTime}, {
            where: {
                uuid: uuid
            }
        }).then(r => {
            Meeting.findOne({
                where: {
                    uuid: uuid
                },
                include: {
                    model: Host
                }
            }).then(meeting => {
                meeting.hosts().forEach(host => {
                    HostService.getHostWithTimeSlots(host.uuid)
                        .then(h => {
                            slice(h, req)
                        })
                })
        })
    })
}

function slice(slot, meeting) {
    if (slot.startDatetime >= meeting.startTime && slot.duration <= meeting.duration) {
        return TimeSlot.destroy({where: {id: slot.id}})
    } else {
        if (slot.startDatetime < meeting.startTime) {
            let slotEndDate = slot.startDatetime.getTime() + slot.duration * 60000
            let meetingStartDate = meeting.startTime.getTime()
            let meetingEndDate = meeting.startTime.getTime() + meeting.duration * 60000

            if (slotEndDate < meetingStartDate) {
                return null // THINK ABOUT STH SMART DUDE
            }
            if (slotEndDate > meetingEndDate) {
                let newDuration = (meeting.startTime.getTime() - slot.startDatetime.getTime())/60000
                return TimeSlot.update({duration: newDuration}, {
                    where: {
                        id: slot.id
                    }
                })
            } else {
                let newDuration = (meeting.startTime.getTime() - slot.startDatetime.getTime())/60000
                return TimeSlot.update({duration: newDuration}, {
                    where: {
                        id: slot.id
                    }
                }).then(_ => {
                    return TimeSlot.create({
                        startDatetime: new Date(meetingEndDate),
                        duration: (slotEndDate - meetingEndDate) / 60000
                    })
                })
            }
        } else {
            let slotEndDate = slot.startDatetime.getTime() + slot.duration * 60000
            let meetingEndDate = meeting.startTime.getTime() + meeting.duration * 60000
            return TimeSlot.update({
                startDatetime: new Date(meetingEndDate),
                duration: (slotEndDate - meetingEndDate) / 60000
            }, {
                where: {
                    id: slot.id
                }
            })
        }
    }
}

    exports.getTimeSlotsIntersection = (uuid) => getTimeSlotsIntersection(uuid)
    exports.pickTimeSlot = (uuid) => pickTimeSlot(uuid)


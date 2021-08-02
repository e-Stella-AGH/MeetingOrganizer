const {models} = require('../db/relations')
const TimeSlot = models.TimeSlot

const TimeSlotsUtils = {

    getIntersection: function (slots) {
        let res = []
        let pointers = new Array(slots.length).fill(0)
        let l = -1
        let r = -1
        while (!isNaN(l) && !isNaN(r) ) {
            let it_slots = new Array(slots.length).fill(0)
            for (let i = 0; i < slots.length; i++) {
                it_slots[i] = slots[i][pointers[i]]
            }
            let vals = it_slots.map(slot => slot !== undefined ? slot.startDatetime.getTime() : undefined)
            l = Math.max(...vals)

            vals = it_slots.map(slot => slot !== undefined ? slot.startDatetime.getTime() + slot.duration * 60000 : undefined)
            r = Math.min(...vals)

            if (l + 15 <= r) {
                res.push({startDatetime: new Date(l), duration: (new Date(r) - new Date(l)) / 60000})
            }

            let valsCopy = [...vals]
            while (valsCopy.indexOf(r) === valsCopy.lastIndex) {
                valsCopy = valsCopy.filter(v => valsCopy.indexOf(v) !== r)
                r = Math.min(...valsCopy)
            }
            pointers[vals.indexOf(r)]++
        }
        return res
    },

    slice: function (slot, reservation) {
        if (slot.startDatetime >= reservation.startTime && slot.duration <= reservation.duration) {
            return TimeSlot.destroy({where: {id: slot.id}})
        } else {
            if (slot.startDatetime < reservation.startTime) {
                let slotEndDate = slot.startDatetime.getTime() + slot.duration * 60000
                let meetingStartDate = reservation.startTime.getTime()
                let meetingEndDate = reservation.startTime.getTime() + reservation.duration * 60000

                if (slotEndDate < meetingStartDate) {
                    return null
                }
                if (slotEndDate > meetingEndDate) {
                    let newDuration = (reservation.startTime.getTime() - slot.startDatetime.getTime()) / 60000
                    return TimeSlot.update({duration: newDuration}, {
                        where: {
                            id: slot.id
                        }
                    })
                } else {
                    let newDuration = (reservation.startTime.getTime() - slot.startDatetime.getTime()) / 60000
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
                let meetingEndDate = reservation.startTime.getTime() + reservation.duration * 60000
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
}

exports.TimeSlotsUtils = TimeSlotsUtils
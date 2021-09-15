const { models } = require('../db/relations')
const TimeSlot = models.TimeSlot

const minDuration = 15
const minToMsMult = 60000

const addMinutesToDatetime = (datetime, minutes) => new Date(datetime.getTime() + minutes * minToMsMult)

const TimeSlotsUtils = {

    divideIntersectionOnDurationSlot: function (intersections, duration) {
        const resultSlots = []
        intersections
            .filter(slot => slot.duration >= duration)
            .forEach(slot => {
                const endDatetime = addMinutesToDatetime(slot.startDatetime, slot.duration)
                for (let startDatetime = slot.startDatetime;
                    addMinutesToDatetime(startDatetime, duration) <= endDatetime;
                    startDatetime = addMinutesToDatetime(startDatetime, duration)) resultSlots.push({ startDatetime, duration })
            })
        return resultSlots
    },

    getIntersection: function (slots) {
        let res = []
        let pointers = new Array(slots.length).fill(0)
        let l = -1
        let r = -1
        while (!isNaN(l) && !isNaN(r)) {
            let it_slots = new Array(slots.length).fill(0)
            for (let i = 0; i < slots.length; i++) {
                it_slots[i] = slots[i][pointers[i]]
            }
            let vals = it_slots.map(slot => slot !== undefined ? slot.startDatetime.getTime() : undefined)
            l = Math.max(...vals)

            vals = it_slots.map(slot => slot !== undefined ? slot.startDatetime.getTime() + slot.duration * minToMsMult : undefined)
            r = Math.min(...vals)

            if (l + minDuration <= r) {
                res.push({ startDatetime: new Date(l), duration: (new Date(r) - new Date(l)) / minToMsMult })
            }

            let valsCopy = [...vals]
            while (valsCopy.indexOf(r) === valsCopy.lastIndex) {
                valsCopy = valsCopy.filter((v, i) => i !== valsCopy.indexOf(r))
                r = Math.min(...valsCopy)
            }
            pointers[vals.indexOf(r)]++
        }
        return res
    },

    sliceSlots: function (slot, reservation) {
        if (slot.startDatetime >= reservation.startTime && slot.duration <= reservation.duration) {
            return TimeSlot.destroy({ where: { id: slot.id } })
        } else {
            if (slot.startDatetime < reservation.startTime) {
                let slotEndDate = slot.startDatetime.getTime() + slot.duration * minToMsMult
                let meetingStartDate = reservation.startTime.getTime()
                let meetingEndDate = reservation.startTime.getTime() + reservation.duration * minToMsMult

                if (slotEndDate < meetingStartDate) {
                    return null
                }
                if (slotEndDate > meetingEndDate) {
                    let newDuration = (reservation.startTime.getTime() - slot.startDatetime.getTime()) / minToMsMult
                    return TimeSlot.update({ duration: newDuration }, {
                        where: {
                            id: slot.id
                        }
                    })
                } else {
                    let newDuration = (reservation.startTime.getTime() - slot.startDatetime.getTime()) / minToMsMult
                    return TimeSlot.update({ duration: newDuration }, {
                        where: {
                            id: slot.id
                        }
                    }).then(_ => {
                        return TimeSlot.create({
                            startDatetime: new Date(meetingEndDate),
                            duration: (slotEndDate - meetingEndDate) / minToMsMult
                        })
                    })
                }
            } else {
                let slotEndDate = slot.startDatetime.getTime() + slot.duration * minToMsMult
                let meetingEndDate = reservation.startTime.getTime() + reservation.duration * minToMsMult
                return TimeSlot.update({
                    startDatetime: new Date(meetingEndDate),
                    duration: (slotEndDate - meetingEndDate) / minToMsMult
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
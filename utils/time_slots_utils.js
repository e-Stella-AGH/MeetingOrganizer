const { models } = require('../db/relations')
const TimeSlot = models.TimeSlot

const minDuration = 15
const minToMsMult = 60000

const addMinutesToDatetime = (datetime, minutes) => new Date(datetime.getTime() + minutes * minToMsMult)

const substractDatesInMinutes = (date1, date2) => Math.round(Math.abs(date1 - date2) / minToMsMult, 0)

const slotIncludeInReservation = (slot, reservation) =>
    reservation.startTime >= slot.startDatetime && reservation.duration <= slot.duration

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

    sliceSlots: async function (slot, reservation, uuid) {
        if (!slotIncludeInReservation(slot, reservation)) return [slot]
        const result = []
        let duration = substractDatesInMinutes(slot.startDatetime, reservation.startTime)
        if (duration > 0) result.push(await TimeSlot.create({
            startDatetime: slot.startDatetime, duration,
            HostUuid: uuid
        }))
        const slotEnd = addMinutesToDatetime(slot.startDatetime, slot.duration)
        const reservationEnd = addMinutesToDatetime(reservation.startTime, reservation.duration)
        duration = substractDatesInMinutes(reservationEnd, slotEnd)
        if (duration > 0) result.push(await TimeSlot.create({
            startDatetime: reservationEnd, duration,
            HostUuid: uuid
        }))
        await TimeSlot.destroy({ where: { id: slot.id } })
        return result
    }
}

exports.TimeSlotsUtils = TimeSlotsUtils
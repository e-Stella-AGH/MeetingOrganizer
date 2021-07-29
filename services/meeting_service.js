const {models} = require('../db/relations')
const {Checker} = require('./data_checker')
const Meeting = models.Meeting
const Guest = models.Guest
const Host = models.Host
const TimeSlot = models.TimeSlot
const {HostService} = require('../services/host_service')

const BAD_REQUEST_CODE = 400
Meeting.hosts = Meeting.belongsToMany(Host, {through: "MeetingHost"})
Host.timeSlots = Host.hasMany(TimeSlot)


const findOrCreateGuest = async(email) => {
    const guest = await Guest.findOrCreate({where:{email: email}})
    return guest[0];
}

const findOrCreateHosts = async(emails) => {
    const hostsArray = []
    for(const email of emails) hostsArray.push(await Host.findOrCreate({where: {email: email}}))
    return hostsArray.map( hostArray => hostArray[0])
}

const areNewHosts = async (meeting,hostsMails) => {
    const meetingHosts = await meeting.getHosts();
    const meetingMails = meetingHosts.map(host => host.emial)
    return JSON.stringify(meetingMails) === JSON.stringify(hostsMails)
}

const isNewGuest = async (meeting,guestMail) => {
    const guest = await meeting.getGuest();
    return guest.email === guestMail
}

const updateMeetingHosts = async(meeting,hostsMails) => {
    if(await areNewHosts(meeting,hostsMails))return;
    const hosts = await findOrCreateHosts(hostsMails)
    await meeting.setHosts(hosts)
}

const updateMeetingGuest = async (meeting,guestMail) => {
    if(await isNewGuest(meeting,guestMail))return;
    const guest = await findOrCreateGuest(guestMail)
    await meeting.setGuest(guest)
}

const updateMeetingDuration = async(meeting, duration) => 
    {if(meeting.duration!==duration) await meeting.update({duration: duration}, {where: {uuid: meeting.uuid}})}

const createResponse = (msg, status = 200) => {return {
        msg: msg,
        status: status
    }
}

const meetingService = {

    createMeeting: async (uuid,hostsMails, guestMail, duration) => {
        var checkData, meeting
        if(uuid === undefined){
            checkData = Checker.checkData(hostsMails,guestMail,duration)
            meeting = await Meeting.create({duration: duration})
        }else{
            checkData = Checker.checkDataWithUUID(uuid,hostsMails,guestMail,duration)
            meeting = await Meeting.create({uuid:uuid, duration: duration})
        }
        if(checkData!==true) return createResponse(checkData, BAD_REQUEST_CODE)
        const guest = await findOrCreateGuest(guestMail)
        const hosts = await findOrCreateHosts(hostsMails)
        await meeting.setGuest(guest)
        await meeting.setHosts(hosts)
        return {...createResponse("Meeting added"), uuid: meeting.uuid}
    },
        

    updateMeeting: async (uuid, hostsMails, guestMail, duration) => {
        const meeting = await Meeting.findByPk(uuid)
        const checkData = Checker.checkDataWithUUID(uuid,hostsMails,guestMail,duration)
        if(checkData!==true) return createResponse(checkData, BAD_REQUEST_CODE)
        if(meeting.startTime!==null) return createResponse("You can't update scheduled meeting",BAD_REQUEST_CODE)
        await updateMeetingHosts(meeting,hostsMails)
        await updateMeetingGuest(meeting,guestMail)
        await updateMeetingDuration(meeting,duration)
        return createResponse("Meeting updated")
    },

    deleteMeeting: async (uuid) => await Meeting.destroy({where: {uuid: uuid}})
    

}

//ADDED
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


exports.meetingService = meetingService
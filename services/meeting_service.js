const {models} = require('../db/relations')
const {Checker} = require('./data_checker')
const Meeting = models.Meeting
const Guest = models.Guest
const Host = models.Host
const TimeSlot = models.TimeSlot
const {HostService} = require('../services/host_service')
const {TimeSlotsUtils} = require('../utils/time_slots_utils')
const {RestUtils} = require('../utils/rest_utils')

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

const getMeetingWithHosts = async (uuid) => {
    return Meeting.findOne({
        where: {
            uuid: uuid
        },
        include: {
            model: Host
        }
    })
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
        if(checkData!==true) return RestUtils.createResponse(checkData, RestUtils.BAD_REQUEST_CODE)
        const guest = await findOrCreateGuest(guestMail)
        const hosts = await findOrCreateHosts(hostsMails)
        await meeting.setGuest(guest)
        await meeting.setHosts(hosts)
        return {...RestUtils.createResponse("Meeting added"), uuid: meeting.uuid}
    },
        

    updateMeeting: async (uuid, hostsMails, guestMail, duration) => {
        const meeting = await Meeting.findByPk(uuid)
        const checkData = Checker.checkDataWithUUID(uuid,hostsMails,guestMail,duration)
        if(checkData!==true) return RestUtils.createResponse(checkData, RestUtils.BAD_REQUEST_CODE)
        if(meeting.startTime!==null) return RestUtils.createResponse("You can't update scheduled meeting", RestUtils.BAD_REQUEST_CODE)
        await updateMeetingHosts(meeting,hostsMails)
        await updateMeetingGuest(meeting,guestMail)
        await updateMeetingDuration(meeting,duration)
        return RestUtils.createResponse("Meeting updated")
    },

    deleteMeeting: async (uuid) => await Meeting.destroy({where: {uuid: uuid}}),

    getTimeSlotsIntersection: async (uuid) => {
        const meeting = await getMeetingWithHosts(uuid)
        if (meeting == null) return RestUtils.createResponse("No meeting with such ID!", RestUtils.NOT_FOUND_CODE)
        let slots = []
        for (const host of await meeting.getHosts()) {
            const h = await HostService.getHostWithTimeSlots(host.uuid)
            slots.push(h.host.TimeSlots)
        }
        slots.forEach(s => s.sort((a, b) => a.startDatetime < b.startDatetime))
        const intersection = TimeSlotsUtils.getIntersection(slots)
        return {...RestUtils.createResponse("Available timeslots"), timeSlots: intersection}
    },

    pickTimeSlot: async (uuid, req) => {
        await Meeting.update({startTime: req.startTime}, {
            where: {
                uuid: uuid
            }
        });
        const meeting = await getMeetingWithHosts(uuid)
        // console.log(meeting)
        for (const host of meeting.Hosts) {
            const hostResponse = await HostService.getHostWithTimeSlots(host.uuid)
            hostResponse.host.TimeSlots.forEach(slot => TimeSlotsUtils.slice(slot, req))
        }
        return RestUtils.createResponse("Meeting reserved")
    }

}


exports.meetingService = meetingService
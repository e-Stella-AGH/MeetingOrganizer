const { models } = require('../db/relations')
const { Checker } = require('./data_checker')
const Meeting = models.Meeting
const Guest = models.Guest
const Host = models.Host
const { Responses } = require('../utils/responses')
const createResponse = Responses.createResponse
const TimeSlot = models.TimeSlot
const {HostService} = require('../services/host_service')
const {TimeSlotsUtils} = require('../utils/time_slots_utils')
const {RestUtils} = require('../utils/rest_utils')

Meeting.hosts = Meeting.belongsToMany(Host, {through: "MeetingHost"})
Host.timeSlots = Host.hasMany(TimeSlot)


const findOrCreateGuest = async (email) => {
    const guest = await Guest.findOrCreate({ where: { email: email } })
    return guest[0];
}

const findOrCreateHosts = async (emails) => {
    const hostsArray = []
    for (const email of emails) hostsArray.push(await Host.findOrCreate({ where: { email: email } }))
    return hostsArray.map(hostArray => hostArray[0])
}

const areNewHosts = async (meeting, hostsMails) => {
    const meetingHosts = await meeting.getHosts();
    const meetingMails = meetingHosts.map(host => host.email).sort()
    return JSON.stringify(meetingMails) === JSON.stringify(hostsMails.sort())
}

const isNewGuest = async (meeting, guestMail) => {
    const guest = await meeting.getGuest();
    return guest.email === guestMail
}

const updateMeetingHosts = async (meeting, hostsMails) => {
    if (await areNewHosts(meeting, hostsMails)) return;
    const hosts = await findOrCreateHosts(hostsMails)
    await meeting.setHosts(hosts)
}

const updateMeetingGuest = async (meeting, guestMail) => {
    if (await isNewGuest(meeting, guestMail)) return;
    const guest = await findOrCreateGuest(guestMail)
    await meeting.setGuest(guest)
}

const addGuest = async (meeting, guestMail) => {
    const guest = await findOrCreateGuest(guestMail)
    await meeting.setGuest(guest)
}
const addHosts = async (meeting, hostsMails) => {
    const hosts = await findOrCreateHosts(hostsMails)
    await meeting.setHosts(hosts)
}
const updateMeetingDuration = async (meeting, duration) => { if (meeting.duration !== duration) await meeting.update({ duration: duration }, { where: { uuid: meeting.uuid } }) }

const meetingService = {

    createMeeting: async (uuid, hostsMails, guestMail, duration, creator) => {
        const checkData = uuid === undefined ? Checker.checkData(hostsMails, guestMail, duration) : Checker.checkDataWithUUID(uuid, hostsMails, guestMail, duration)
        if (checkData !== true) return createResponse(checkData, BAD_REQUEST_CODE)
        const data = uuid === undefined ? { duration: duration } : { uuid: uuid, duration: duration }
        const meeting = await Meeting.create(data)
        await addGuest(meeting, guestMail)
        await addHosts(meeting, hostsMails)
        await meeting.setOrganizer(creator)
        return { ...createResponse("Meeting added", 201), uuid: meeting.uuid }
    },


    updateMeeting: async (meeting, hostsMails, guestMail, duration) => {
        const checkData = Checker.checkData(hostsMails, guestMail, duration)
        if (checkData !== true) return createResponse(checkData, BAD_REQUEST_CODE)
        console.log(meeting)
        console.log(meeting.startTime)
        if (meeting.startTime !== null) return createResponse("You can't update scheduled meeting", BAD_REQUEST_CODE)
        await updateMeetingHosts(meeting, hostsMails)
        await updateMeetingGuest(meeting, guestMail)
        await updateMeetingDuration(meeting, duration)
        return createResponse("Meeting updated")
    },

    deleteMeeting: async (uuid) => await Meeting.destroy({ where: { uuid: uuid } })


}

exports.MeetingService = meetingService
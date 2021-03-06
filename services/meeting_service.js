const { models } = require('../db/relations')
const { Checker } = require('./data_checker')
const Meeting = models.Meeting
const Guest = models.Guest
const Host = models.Host
const { Responses } = require('../utils/responses')
const createResponse = Responses.createResponse
const TimeSlot = models.TimeSlot
const { HostService } = require('../services/host_service')
const { TimeSlotsUtils } = require('../utils/time_slots_utils')
const { RestUtils } = require('../utils/rest_utils')
const Organizer = models.Organizer
const { MailService } = require('./mail_service')
const { RabbitService } = require('../service_integration/rabbitmq_service')

Meeting.hosts = Meeting.belongsToMany(Host, { through: "MeetingHost" })
Host.meetings = Host.belongsToMany(Meeting, { through: "MeetingHost" })
Host.timeSlots = Host.hasMany(TimeSlot)

Meeting.organizer = Meeting.belongsTo(Organizer, { through: "OrganizerMeeting" })
Organizer.meetings = Organizer.belongsToMany(Meeting, { through: "OrganizerMeeting" })


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

const getMeetingWithHosts = async (uuid) => {
    return await Meeting.findOne({
        where: {
            uuid: uuid
        },
        include: {
            model: Host,
            model: Guest
        }
    })
}

const existMeeting = async (uuid) => {
    return (await Meeting.findAndCountAll({
        where: {
            uuid: uuid
        }
    })).count > 0
}

const intersectionNotExist = async (meeting, startTime) => await getIntersection(meeting)
    .then(intersections => intersections
        .filter(intersection => intersection.startDatetime.getTime() === startTime.getTime())
        .length === 0)

const getIntersection = async (meeting) => {
    let slots = []
    for (const host of await meeting.getHosts()) {
        slots.push((await HostService.getHostWithTimeSlots(host.uuid)).host.TimeSlots)
    }
    slots.forEach(s => s.sort((a, b) => a.startDatetime < b.startDatetime))
    const now = Date.now()
    let intersections = TimeSlotsUtils.getIntersection(slots).filter(slot => slot.startDatetime > now)
    return TimeSlotsUtils.divideIntersectionOnDurationSlot(intersections, meeting.duration)
}

const sendMeetingEmail = async (meeting, organizer) => {
    const intersection = await getIntersection(meeting)
    const hosts = await meeting.getHosts()
    const guest = await meeting.getGuest()
    if (intersection.length === 0) hosts.forEach(async host => {
        const otherHosts = hosts.filter(otherHost => otherHost !== host).map(host => host.email)
        await MailService.addMoreSlotsHosts(host, otherHosts, organizer.email, guest.email)
    })
    await MailService.pickSlotGuest(guest.email, meeting.uuid, organizer.email)
}


const meetingService = {

    createMeeting: async (uuid, hostsMails, guestMail, duration, creator) => {
        if (uuid !== undefined && await existMeeting(uuid)) return createResponse("Meeting with this uuid already exist", RestUtils.BAD_REQUEST_CODE)
        const checkData = uuid === undefined ? Checker.checkData(hostsMails, guestMail, duration) : Checker.checkDataWithUUID(uuid, hostsMails, guestMail, duration)
        if (checkData !== true) return createResponse(checkData, RestUtils.BAD_REQUEST_CODE)
        const data = uuid === undefined ? { duration: duration } : { uuid: uuid, duration: duration }
        const meeting = await Meeting.create(data)
        await addGuest(meeting, guestMail)
        await addHosts(meeting, hostsMails)
        await meeting.setOrganizer(creator)
        await sendMeetingEmail(meeting, creator)

        return { ...createResponse("Meeting added", 201), uuid: meeting.uuid }
    },


    updateMeeting: async (meeting, hostsMails, guestMail, duration) => {
        const checkData = Checker.checkData(hostsMails, guestMail, duration)
        if (checkData !== true) return createResponse(checkData, RestUtils.BAD_REQUEST_CODE)
        if (meeting.startTime !== null) return createResponse("You can't update scheduled meeting", RestUtils.BAD_REQUEST_CODE)
        await updateMeetingHosts(meeting, hostsMails)
        await updateMeetingGuest(meeting, guestMail)
        await updateMeetingDuration(meeting, duration)
        return createResponse("Meeting updated")
    },

    deleteMeeting: async (uuid) => {
        await Meeting.destroy({ where: { uuid: uuid } })
        return createResponse("Meeting deleted")
    },

    getMeetings: async (organizer) => {
        let meetings = await Meeting.findAll({
            where: {
                "OrganizerId": organizer.id
            },
            include: {
                model: Organizer,
                model: Guest
            }
        })
        meetings = await Promise.all(meetings.map(async meeting => {
            meeting.dataValues.Hosts = await meeting.getHosts()
            return meeting
        }))

        return createResponse(meetings)
    },


    getTimeSlotsIntersection: async (uuid) => {
        const meeting = await getMeetingWithHosts(uuid)
        if (meeting == null) return RestUtils.createResponse("No meeting with such ID!", RestUtils.NOT_FOUND_CODE)
        const intersection = await getIntersection(meeting)
        return { ...RestUtils.createResponse("Available timeslots"), timeSlots: intersection }
    },

    pickTimeSlot: async (uuid, startTime, duration) => {
        if (!startTime || !duration) return RestUtils.createResponse("StartTime or duration wasn't set", RestUtils.BAD_REQUEST_CODE)
        const meeting = await getMeetingWithHosts(uuid)
        if (meeting === null) return RestUtils.createResponse("Meeting with this uuid doesn't exist", RestUtils.NOT_FOUND_CODE)
        if (meeting.startTime !== null)
            return RestUtils.createResponse("Meeting date is already set", RestUtils.BAD_REQUEST_CODE)
        startTime = new Date(startTime)
        if (meeting.duration !== duration) return RestUtils.createResponse("Requested meeting duration is not proper", RestUtils.BAD_REQUEST_CODE)
        if (await intersectionNotExist(meeting, startTime))
            return RestUtils.createResponse("Requested meeting date is not proper", RestUtils.BAD_REQUEST_CODE)
        await Meeting.update({ startTime: startTime }, {
            where: {
                uuid: uuid
            }
        });
        const hosts = await meeting.getHosts()
        for (const host of hosts) {
            const hostResponse = await HostService.getHostWithTimeSlots(host.uuid)
            await Promise.all(
                hostResponse.host.TimeSlots
                    .map(async slot => await TimeSlotsUtils.sliceSlots(slot, { startTime, duration }, host.uuid))
            )
        }
        RabbitService.sendPickedMeetingDate(uuid, startTime, duration, hosts.map(host => host.email))
        return RestUtils.createResponse("Meeting reserved")
    },

    askForMoreTimeSlots: async (uuid) => {
        const meeting = await getMeetingWithHosts(uuid)
        const hosts = await meeting.getHosts()
        const guest = await meeting.getGuest()
        await MailService.askForMoreSlots(guest, hosts)
        return createResponse("Mails were sent")
    }


}

exports.MeetingService = meetingService
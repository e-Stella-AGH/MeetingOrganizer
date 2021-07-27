const {models} = require('../db/relations')
const {Checker} = require('./data_checker')
const Meeting = models.Meeting
const Guest = models.Guest
const Host = models.Host

const BAD_REQUEST_CODE = 400

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

exports.meetingService = meetingService
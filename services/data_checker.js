
const mailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

const uuidRegex = /^([0-9a-fA-F]{8})-(([0-9a-fA-F]{4}\-){3})([0-9a-fA-F]{12})$/i

const checkUUID = (uuid) => uuidRegex.test(uuid)

const checkMail = (mail) => mail !== undefined && mail !== null ? mailRegex.test(mail.toLowerCase()) : false

const Checker = {

    checkDataWithUUID: (uuid, hostsMails, guestMail, duration) => {
        if (!checkUUID(uuid)) return "Not proper UUID"
        return Checker.checkData(hostsMails, guestMail, duration)
    },

    checkData: (hostsMails, guestMail, duration) => {
        if (!checkMail(guestMail)) return "Guest mail is not valid mail"
        if (hostsMails.length === 0) return "There must be at least one host in the meeting"
        const hosts = hostsMails.filter(mail => !checkMail(mail))
        if (hosts.length !== 0) return "These are not valid mails: " + hosts.join(" ")
        if (!Number.isInteger(duration)) return "Duration is not proper integer"
        return true
    },

    checkEmail: (email) => {
        if (!checkMail(email)) return "Not valid email"
        return true
    },

    checkTimeSlot: (timeSlot) => {
        if (!("startDatetime" in timeSlot) || !("duration" in timeSlot)) return 'TimeSlot needs to have "startDatetime" and "duration" parameters!'
        if (new Date(timeSlot.startDatetime).getTime() < Date.now()) return "Time slot cannot start in the past!"
        return true
    }

}

exports.Checker = Checker
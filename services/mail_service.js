const fetch = require("node-fetch")
const env = process.env
const serviceUrl = env.MAIL_SERVICE_URL
const frontendUrl = env.FRONTEND_URL
const sendMail = async (body) => {
    if (serviceUrl === undefined || serviceUrl === null || serviceUrl === "") {
        console.log("Service url not found")
        return false
    }
    const result = await fetch(serviceUrl, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })
    return result.status !== 200
}

const mailService = {
    addMoreSlotsHosts: async (host, hosts, organizer, guest) => {
        return await sendMail({
            subject: "Add more time slots",
            sender_email: organizer,
            sender_name: organizer,
            receiver: host.email,
            content: `Hi,
                Add more time slots for meeting with ${guest}, because there is no slot where all of you can attend. 
                You can do this at this link: ${frontendUrl + "meeting/host/" + host.uuid}.
                ` + hosts.length !== 0 ? `You can contact with other meeting participants: ${hosts.join(", ")}` : ""
        })
    },

    askForMoreSlots: async (guest, hosts) => {
        const promises = hosts.map(async host => await sendMail({
            subject: "Guest asked for adding more slots for interview",
            sender_email: guest,
            sender_name: guest,
            receiver: host,
            content: `Hi 
                ${guest} asked for adding more time slots for meeting, because he can't attend on any from available slots.
                You can do this at this link: ${frontendUrl + "meeting/host/" + host.uuid}.
                `
        }))

        return (await Promise.all(promises)).some(elem => elem)
    },

    pickSlotGuest: async (guest, meetingUuid, organizer) => {
        return await sendMail({
            subject: "Pick time slot for interview",
            sender_email: organizer,
            sender_name: organizer,
            receiver: guest,
            content: `Hi, could you pick timeslot for interview? You can do this at this link: ${frontendUrl + "meeting/job_seeker/" + meetingUuid}`
        })
    }
}


exports.MailService = mailService
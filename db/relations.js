const {Organizer} = require('./organizer')
const {Meeting} =  require('./meeting')
const {Guest} = require('./guest')
const {Host} = require('./host')
const {TimeSlot} = require('./time_slot')

Organizer.meetings = Organizer.belongsToMany(Meeting, {through: "OrganizerMeeting"})
Meeting.organizer = Meeting.belongsTo(Organizer, {through: "OrganizerMeeting"})

Meeting.guest = Meeting.hasOne(Guest, {through: "GuestMeeting"})
Guest.meetings = Guest.belongsToMany(Meeting, {through: "GuestMeeting"})

Meeting.hosts = Meeting.belongsToMany(Host, {through: "MeetingHost"})
Host.meetings = Host.belongsToMany(Meeting, {through: "MeetingHost"})

Host.timeSlots = Host.hasMany(TimeSlot)

exports.models = {
    Organizer: Organizer,
    Meeting: Meeting,
    Host: Host,
    Guest: Guest,
    TimeSlot: TimeSlot
}
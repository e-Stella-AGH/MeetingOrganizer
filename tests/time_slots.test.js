const request = require("supertest");
const db = require("../db/relations")
const { sequelize } = require("../db/sequelizer")
const app = require("../app");
const { HostService } = require('../services/host_service')
const { Utils } = require("./test_utils")


describe("Test the PUT on host", () => {

    beforeAll(async () => {
        await sequelize.sync()
        await Utils.fakeRegister()
        jwt = await Utils.registerAndLoginUser(bodyLogin)
        await request(app).post("/meeting").set(header, jwt)
            .send({ ...body, uuid: uuid })
            .then(response => {
                expect(response.statusCode).toBe(201)
                expect(response.body.msg).toBe("Meeting added")
            })
    })

    test("It should respond that the timeslots has been set", done => {
        db.models.Meeting.findByPk(uuid).then(meeting => meeting.getHosts())
            .then(hosts => {
                return Promise.all([
                    request(app).put("/host/" + hosts[0].uuid).send(firstTimeSlots),
                    request(app).put("/host/" + hosts[1].uuid).send(secondTimeSlots)
                ])
            })
            .then(responses => {
                responses.forEach(response => {
                    expect(response.statusCode).toBe(200)
                    expect(response.body.msg).toBe("Host time slots updated")
                })
                return db.models.Meeting.findByPk(uuid)
            })
            .then(meeting => meeting.getHosts())
            .then(async (hosts) => {
                let hostResponse = await HostService.getHostWithTimeSlots(hosts[0].uuid)
                expect(hostResponse.host.TimeSlots.map(slot => { return { startDatetime: slot.startDatetime, duration: slot.duration } })).toStrictEqual(firstTimeSlots)
                hostResponse = await HostService.getHostWithTimeSlots(hosts[1].uuid)
                expect(hostResponse.host.TimeSlots.map(slot => { return { startDatetime: slot.startDatetime, duration: slot.duration } })).toStrictEqual(secondTimeSlots)
                done()
            })
    })

})

describe("Test the GET on meeting", () => {

    beforeAll(async () => {
        await sequelize.sync()
    })

    test("It should return intersection of hosts timeslots", done => {
        request(app).get("/meeting/" + uuid)
            .then(meetingResponse => {
                expect(meetingResponse.statusCode).toBe(200)
                expect(JSON.stringify(meetingResponse.body.timeSlots))
                    .toStrictEqual(JSON.stringify(timeSlotsIntersection))
                done()
            })
    })
})



const header = "authorization"

let jwt

let bodyLogin = {
    "email": "meeting@meeting.pl",
    "password": "test"
}

const body = {
    "duration": 30,
    "hosts": ["aba@aba.pl", "ccc@ccc.pl"],
    "guest": "a@a.pl"
}

const firstTimeSlots = [
    {
        startDatetime: new Date(2022, 5, 23, 11),
        duration: 120
    },
    {
        startDatetime: new Date(2022, 5, 23, 14),
        duration: 60
    },
    {
        startDatetime: new Date(2022, 5, 25, 12),
        duration: 300
    }
]

const secondTimeSlots = [
    {
        startDatetime: new Date(2022, 5, 23, 12),
        duration: 240
    },
    {
        startDatetime: new Date(2022, 5, 25, 13),
        duration: 120
    }
]

const timeSlotsIntersection = [
    {
        startDatetime: new Date(2022, 5, 23, 12),
        duration: 60
    },
    {
        startDatetime: new Date(2022, 5, 23, 14),
        duration: 60
    },
    {
        startDatetime: new Date(2022, 5, 25, 13),
        duration: 120
    }
]

const uuid = "ad18668e-4a28-4565-9f4a-4eace3068a63"


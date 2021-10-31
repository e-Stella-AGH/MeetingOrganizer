const request = require("supertest");
const db = require("../db/relations")
const { sequelize } = require("../db/sequelizer")
const app = require("../app");
const { Utils } = require("./test_utils")
const { HostService } = require('../services/host_service')
const amqp = require('amqplib/callback_api')

const uuid = "ad18668e-4a28-4565-9f4a-4eace3068a62"
const amqp_url = process.env.CLOUD_AMQP || "amqp://localhost:5672"

const jestTimeout = 30_000
jest.setTimeout(jestTimeout);


describe("Test pick_time_slot", () => {

    beforeAll((done) => {
        sequelize.sync()
            .then(_result => Utils.fakeRegister())
            .then(_result => Utils.registerAndLoginUser(bodyLogin))
            .then(result => {
                jwt = result
                return request(app).post("/meeting").set(header, jwt).send(body)
            })
            .then(_result => db.models.Meeting.findByPk(uuid))
            .then(meeting => meeting.getHosts())
            .then(async (hosts) => {
                await request(app).put("/host/" + hosts[0].uuid).send(timeSlots1)
                await request(app).put("/host/" + hosts[1].uuid).send(timeSlots2)
                done()
            })

        jest.doMock('../services/mail_service').default
    })

    test("It should respond that requested duration is invalid", done => {
        request(app).put("/meeting/" + uuid + "/pick_time_slot")
            .send({ ...pickedTimeSlot, duration: 60 })
            .then(response => {
                expect(response.statusCode).toBe(400)
                expect(response.body.msg).toBe("Requested meeting duration is not proper")
                done()
            })
    })
    test("It should respond that requested date is invalid", done => {
        request(app).put("/meeting/" + uuid + "/pick_time_slot")
            .send({ ...pickedTimeSlot, "startTime": new Date(2022, 5, 1, 11) })
            .then(response => {
                expect(response.statusCode).toBe(400)
                expect(response.body.msg).toBe("Requested meeting date is not proper")
                done()
            })
    })
    test("It should respond that duration or startTime wasn't set", done => {
        request(app).put("/meeting/" + uuid + "/pick_time_slot")
            .send({})
            .then(response => {
                expect(response.statusCode).toBe(400)
                expect(response.body.msg).toBe("StartTime or duration wasn't set")
                done()
            })
    })
    test("It should respond that meeting with this uuid doesn't exist ", done => {
        request(app).put("/meeting/" + "ad18668e-4a28-4565-9f4a-5eace3068a62" + "/pick_time_slot")
            .send(pickedTimeSlot)
            .then(response => {
                expect(response.statusCode).toBe(404)
                expect(response.body.msg).toBe("Meeting with this uuid doesn't exist")
                done()
            })
    })

    test("It should respond that the meeting has been reserved", done => {
        request(app).put("/meeting/" + uuid + "/pick_time_slot")
            .send(pickedTimeSlot)
            .then(response => {
                expect(response.statusCode).toBe(200)
                expect(response.body.msg).toBe("Meeting reserved")
                return db.models.Meeting.findByPk(uuid)
            })
            .then(meeting => {
                expect(meeting.startTime.getTime()).toBe(pickedTimeSlot.startTime.getTime())
                return meeting.getHosts()
            }).then(async (hosts) => {
                let hostResponse = await HostService.getHostWithTimeSlots(hosts[0].uuid)
                expect(hostResponse.host.TimeSlots.map(slot => { return { startDatetime: slot.startDatetime, duration: slot.duration } })).toEqual(expect.arrayContaining(endTimeSlots1))
                hostResponse = await HostService.getHostWithTimeSlots(hosts[1].uuid)
                expect(hostResponse.host.TimeSlots.map(slot => { return { startDatetime: slot.startDatetime, duration: slot.duration } })).toEqual(expect.arrayContaining(endTimeSlots2))
                consume(done)
            })
    })
    test("It should respond that the meeting date is already set", done => {
        request(app).put("/meeting/" + uuid + "/pick_time_slot")
            .send(pickedTimeSlot)
            .then(response => {
                expect(response.statusCode).toBe(400)
                expect(response.body.msg).toBe("Meeting date is already set")
                done()
            })
    })

})


const consume = (doneCb) => {
    amqp.connect(amqp_url, function (connectionError, connection) {
        if (connectionError) throw connectionError
        connection.createChannel(function (createChannelError, channel) {
            if (createChannelError) throw createChannelError
            const queue = "interview"
            channel.assertQueue(queue, {
                durable: true
            })
            channel.consume(queue, msg => {
                const message = Buffer.from(msg.content.toString(), 'base64')
                const response = JSON.parse(message.toString())
                expect(response.meetingUUID).toBe(uuid)
                expect(Date.parse(response.meetingDate)).toBe(pickedTimeSlot.startTime)
                expect(response.meetingLength).toBe(pickedTimeSlot.duration)
                channel.ack(msg)
                doneCb()
            })
        })
        setTimeout(function () {
            connection.close();
        }, 500);
    })
}


const pickedTimeSlot = {
    "startTime": new Date(2022, 5, 23, 12, 15),
    "duration": 15
}

const header = "authorization"

let jwt

let bodyLogin = {
    "email": "meeting@meeting.pl",
    "password": "test"
}

const body = {
    uuid,
    "duration": 15,
    "hosts": ["aba@aba.pl", "ccc@ccc.pl"],
    "guest": "a@a.pl"
}

const timeSlots1 = [
    {
        startDatetime: new Date(2022, 5, 23, 11),
        duration: 120
    },
    {
        startDatetime: new Date(2022, 5, 24, 11),
        duration: 120
    },
]
const endTimeSlots1 = [
    {
        startDatetime: new Date(2022, 5, 23, 11),
        duration: 75
    },
    {
        startDatetime: new Date(2022, 5, 23, 12, 30),
        duration: 30
    },
    {
        startDatetime: new Date(2022, 5, 24, 11),
        duration: 120
    },
]

const timeSlots2 = [
    {
        startDatetime: new Date(2022, 5, 23, 12),
        duration: 120
    },
    {
        startDatetime: new Date(2022, 5, 24, 12),
        duration: 120
    }
]

const endTimeSlots2 = [
    {
        startDatetime: new Date(2022, 5, 23, 12),
        duration: 15
    },
    {
        startDatetime: new Date(2022, 5, 23, 12, 30),
        duration: 90
    },
    {
        startDatetime: new Date(2022, 5, 24, 12),
        duration: 120
    }
]

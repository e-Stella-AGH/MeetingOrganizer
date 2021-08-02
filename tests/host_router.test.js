const request = require("supertest");
const db = require("../db/relations")
const {sequelize} = require("../db/sequelizer")
const app = require("../app");
const {HostService} = require('../services/host_service')

const body = {
    "duration": 30,
    "hosts": ["aba@aba.pl"],
    "guest": "a@a.pl"
}

const timeSlots = [
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


const uuid = "ad18668e-4a28-4565-9f4a-4eace3068a63"

describe("Test the GET on host", () => {
    beforeAll(async () => {
        await sequelize.sync()
        await request(app).post("/meeting")
            .send({...body, uuid: uuid})
            .then(response => {
                expect(response.statusCode).toBe(200)
                expect(response.body.msg).toBe("Meeting added")
            })
        const host = (await db.models.Meeting.findByPk(uuid).then(meeting => meeting.getHosts()))[0]
        await request(app).put("/host/"+host.uuid).send(timeSlots)
    })

    test("It should return host with his timeslots", done => {
        db.models.Meeting.findByPk(uuid)
            .then(meeting => meeting.getHosts())
            .then(hosts => {
            const host = hosts[0]
            request(app).get("/host/" + host.uuid).then(response => {
                    expect(response.statusCode).toBe(200);
                    const hostResponse = response.body.host
                console.log(hostResponse)
                    expect(hostResponse.email).toBe(body.hosts[0])
                    expect(JSON.stringify(hostResponse.TimeSlots
                        .map(slot => {return {startDatetime: slot.startDatetime, duration: slot.duration}})))
                        .toStrictEqual(JSON.stringify(timeSlots))
                    done()
                }
            )
        })
    })
})
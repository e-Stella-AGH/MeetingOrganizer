const request = require("supertest");
const db = require("../db/relations")
const { sequelize } = require("../db/sequelizer")
const app = require("../app");
const { Utils } = require("./test_utils");



describe("Test the POST meeting", () => {

  beforeAll((done) => {
    sequelize.sync()
      .then(_result => Utils.fakeRegister())
      .then(_result => Utils.registerAndLoginUser(bodyLogin))
      .then(result => {
        jwt = result
        return Utils.registerAndLoginUser(bodyLogin2)
      }).then(result => {
        jwt2 = result
        done()
      })
  })

  test("It should respone that the meeting was added", done => {
    request(app).post("/meeting").set(header, jwt)
      .send(body)
      .then(response => {
        expect(response.statusCode).toBe(201)
        expect(response.body.msg).toBe("Meeting added")
        done()
      })
  })

  test("It should respond that guest mail is incorrect", done => {
    request(app).post("/meeting").set(header, jwt)
      .send({ ...body, guest: "aa.pl" })
      .then(response => {
        expect(response.statusCode).toBe(BAD_REQUEST_CODE)
        expect(response.body.msg).toBe("Guest mail is not valid mail")
        done()
      })
  })

  test("It should respond that there are no hosts", done => {
    request(app).post("/meeting").set(header, jwt)
      .send({ ...body, hosts: [] })
      .then(response => {
        expect(response.statusCode).toBe(BAD_REQUEST_CODE)
        expect(response.body.msg).toBe("There must be at least one host in the meeting")
        done()
      })
  })

  test("It should respond that the hosts mail is incorrect", done => {
    request(app).post("/meeting").set(header, jwt)
      .send({ ...body, hosts: ["aba@aba.pl", "cccccc.pl"] })
      .then(response => {
        expect(response.statusCode).toBe(BAD_REQUEST_CODE)
        expect(response.body.msg).toBe("These are not valid mails: cccccc.pl")
        done()
      })
  })
  test("It should respond that the duration is not integer", done => {
    request(app).post("/meeting").set(header, jwt)
      .send({ ...body, duration: "ala" })
      .then(response => {
        expect(response.statusCode).toBe(BAD_REQUEST_CODE)
        expect(response.body.msg).toBe("Duration is not proper integer")
        done()
      })
  })
  test("It should respond that the uuid is incorrect", done => {
    request(app).post("/meeting").set(header, jwt)
      .send({ ...body, uuid: "alazzascxzcx" })
      .then(response => {
        expect(response.statusCode).toBe(BAD_REQUEST_CODE)
        expect(response.body.msg).toBe("Not proper UUID")
        done()
      })
  })


  test("It should respone that the meeting was added with uuid", done => {
    request(app).post("/meeting").set(header, jwt)

      .send({ ...body, uuid: uuid })
      .then(response => {
        expect(response.statusCode).toBe(201)
        expect(response.body.msg).toBe("Meeting added")
        done()
      })
  })

  test("It should send unauthorized with no header", done => {
    request(app).post("/meeting")
      .send({ ...body, uuid: uuid })
      .then(response => {
        expect(response.statusCode).toBe(401)
        expect(response.text).toBe("Unauthorized")
        done()
      })
  })
  test("It should send unauthorized with bad header", done => {
    request(app).post("/meeting").set(header, "14235151341")
      .send({ ...body, uuid: uuid })
      .then(response => {
        expect(response.statusCode).toBe(401)
        expect(response.text).toBe("Unauthorized")
        done()
      })
  })

  test("It should respond with list of 2 meetings", done => {
    request(app).get("/meeting").set(header, jwt)
      .send()
      .then(response => {
        expect(response.statusCode).toBe(200)
        expect(response.body.msg.length).toBe(2)
        done()
      })
  })
})

describe("Test the PUT meeting", () => {


  test("It should respond the correct PUT", done => {
    request(app).put("/meeting/" + uuid).set(header, jwt)
      .send(updatedBody)
      .then(response => {
        expect(response.statusCode).toBe(200)
        expect(response.body.msg).toBe("Meeting updated")
        return db.models.Meeting.findByPk(uuid)
      })
      .then(meeting => {
        expect(meeting.duration).toBe(updatedBody.duration)
        return Promise.all([meeting.getGuest(), meeting.getHosts()])
      })
      .then(data => {
        const guest = data[0];
        expect(guest.email).toBe(updatedBody.guest)
        const hostsMails = data[1].map(host => host.email)
        expect(JSON.stringify(hostsMails.sort())).toBe(JSON.stringify(updatedBody.hosts.sort()))
        done()
      })
  })

  test("It should respond that guest mail is incorrect", done => {
    request(app).put("/meeting/" + uuid).set(header, jwt)

      .send({ ...body, "guest": "aa.pl" })
      .then(response => {
        expect(response.statusCode).toBe(BAD_REQUEST_CODE)
        expect(response.body.msg).toBe("Guest mail is not valid mail")
        done()
      })
  })

  test("It should respond that there are no hosts", done => {
    request(app).put("/meeting/" + uuid).set(header, jwt)
      .send({ ...body, "hosts": [] })
      .then(response => {
        expect(response.statusCode).toBe(BAD_REQUEST_CODE)
        expect(response.body.msg).toBe("There must be at least one host in the meeting")
        done()
      })
  })

  test("It should respond that the hosts mail is incorrect", done => {
    request(app).put("/meeting/" + uuid).set(header, jwt)
      .send({ ...body, "hosts": ["aba@aba.pl", "cccccc.pl"] })
      .then(response => {
        expect(response.statusCode).toBe(BAD_REQUEST_CODE)
        expect(response.body.msg).toBe("These are not valid mails: cccccc.pl")
        done()
      })
  })
  test("It should respond that the duration is not integer", done => {
    request(app).put("/meeting/" + uuid).set(header, jwt)
      .send({ ...body, "duration": "ala" })
      .then(response => {
        expect(response.statusCode).toBe(BAD_REQUEST_CODE)
        expect(response.body.msg).toBe("Duration is not proper integer")
        done()
      })
  })
  test("It should send unauthorized with no header", done => {
    request(app).put("/meeting/" + uuid)
      .send({ ...body, uuid: uuid })
      .then(response => {
        expect(response.statusCode).toBe(401)
        expect(response.text).toBe("Unauthorized")
        done()
      })
  })
  test("It should send unauthorized with bad header", done => {
    request(app).put("/meeting/" + uuid).set(header, "14235151341")
      .send({ ...body, uuid: uuid })
      .then(response => {
        expect(response.statusCode).toBe(401)
        expect(response.text).toBe("Unauthorized")
        done()
      })
  })
  test("It should send unauthorized with not meeting organizer header", done => {
    request(app).put("/meeting/" + uuid).set(header, jwt2)
      .send({ ...body, uuid: uuid })
      .then(response => {
        expect(response.statusCode).toBe(403)
        expect(response.text).toBe("Forbidden")
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
        done()
      })
  })
})

describe("Test the DELETE meeting", () => {

  test("It should send unauthorized with no header", done => {
    request(app).delete("/meeting/" + uuid)
      .send({ ...body, uuid: uuid })
      .then(response => {
        expect(response.statusCode).toBe(401)
        expect(response.text).toBe("Unauthorized")
        done()
      })
  })
  test("It should send unauthorized with bad header", done => {
    request(app).delete("/meeting/" + uuid).set(header, "14235151341")
      .send({ ...body, uuid: uuid })
      .then(response => {
        expect(response.statusCode).toBe(401)
        expect(response.text).toBe("Unauthorized")
        done()
      })
  })
  test("It should send unauthorized with not meeting organizer header", done => {
    request(app).delete("/meeting/" + uuid).set(header, jwt2)
      .send({ ...body, uuid: uuid })
      .then(response => {
        expect(response.statusCode).toBe(403)
        expect(response.text).toBe("Forbidden")
        done()
      })
  })

  test("It should respond the correct DELETE", done => {
    request(app).delete("/meeting/" + uuid).set(header, jwt)
      .then(response => {
        expect(response.statusCode).toBe(200)
        expect(response.body.msg).toBe("Meeting deleted")
        done()
      })
  })
  test("It should respond the 404", done => {
    request(app).delete("/meeting/" + uuid).set(header, jwt)
      .then(response => {
        expect(response.statusCode).toBe(404)
        expect(response.text).toBe("Not Found")
        done()
      })
  })
})

const body = {
  "duration": 15,
  "hosts": ["aba@aba.pl", "ccc@ccc.pl"],
  "guest": "a@a.pl"
}
const updatedBody = {
  "duration": 30,
  "hosts": ["aa@aa.pl", "bbb@bbb.pl"],
  "guest": "b@b.pl"
}

const uuid = "ad18668e-4a28-4565-9f4a-4eace3068a62"

const header = "authorization"

let jwt, jwt2

let bodyLogin = {
  "email": "meeting@meeting.pl",
  "password": "test"
}
let bodyLogin2 = {
  "email": "meeting2@meeting2.pl",
  "password": "test"
}

const pickedTimeSlot = {
  "startTime": new Date(2021, 5, 25, 14, 30),
  "duration": 30
}

const BAD_REQUEST_CODE = 400

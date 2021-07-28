const request = require("supertest");
const db = require("../db/relations")
const { sequelize } = require("../db/sequelizer")
const app = require("../app");
const { Utils } = require("./test_utils")

describe("Test the POST meeting", () => {


  beforeAll(async () => {
    await sequelize.sync()
    jwt = await Utils.registerAndLoginUser(bodyLogin)
    jwt2 = await Utils.registerAndLoginUser(bodyLogin2)
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

  test("It should response that guest mail is incorrect", done => {
    request(app).post("/meeting").set(header, jwt)
      .send({ ...body, guest: "aa.pl" })
      .then(response => {
        expect(response.statusCode).toBe(404)
        expect(response.body.msg).toBe("Guest mail is not valid mail")
        done()
      })
  })

  test("It should response that there are no hosts", done => {
    request(app).post("/meeting").set(header, jwt)
      .send({ ...body, hosts: [] })
      .then(response => {
        expect(response.statusCode).toBe(404)
        expect(response.body.msg).toBe("In the meeting there must be hosts")
        done()
      })
  })

  test("It should response that the hosts mail is incorrect", done => {
    request(app).post("/meeting").set(header, jwt)
      .send({ ...body, hosts: ["aba@aba.pl", "cccccc.pl"] })
      .then(response => {
        expect(response.statusCode).toBe(404)
        expect(response.body.msg).toBe("These are not valid mails: cccccc.pl")
        done()
      })
  })
  test("It should response that the duration is not integer", done => {
    request(app).post("/meeting").set(header, jwt)
      .send({ ...body, duration: "ala" })
      .then(response => {
        expect(response.statusCode).toBe(404)
        expect(response.body.msg).toBe("Duration is not proper integer")
        done()
      })
  })
  test("It should response that the uuid is incorrect", done => {
    request(app).post("/meeting").set(header, jwt)
      .send({ ...body, uuid: "alazzascxzcx" })
      .then(response => {
        expect(response.statusCode).toBe(404)
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

  test("It should send unathorized with no header", done => {
    request(app).post("/meeting")
      .send({ ...body, uuid: uuid })
      .then(response => {
        expect(response.statusCode).toBe(401)
        expect(response.text).toBe("Unauthorized")
        done()
      })
  })
  test("It should send unathorized with bad header", done => {
    request(app).post("/meeting").set(header, "14235151341")
      .send({ ...body, uuid: uuid })
      .then(response => {
        expect(response.statusCode).toBe(401)
        expect(response.text).toBe("Unauthorized")
        done()
      })
  })
})

describe("Test the PUT meeting", () => {

  test("It should response the correct PUT", done => {
    request(app).put("/meeting/" + uuid).set(header, jwt)
      .send(body)
      .then(response => {
        expect(response.statusCode).toBe(200)
        expect(response.body.msg).toBe("Meeting updated")
        db.models.Meeting.findByPk(uuid).then(meeting => {
          done()
        })
      })
  })

  test("It should response that guest mail is incorrect", done => {
    request(app).put("/meeting/" + uuid).set(header, jwt)

      .send({ ...body, "guest": "aa.pl" })
      .then(response => {
        expect(response.statusCode).toBe(404)
        expect(response.body.msg).toBe("Guest mail is not valid mail")
        done()
      })
  })

  test("It should response that there are no hosts", done => {
    request(app).put("/meeting/" + uuid).set(header, jwt)
      .send({ ...body, "hosts": [] })
      .then(response => {
        expect(response.statusCode).toBe(404)
        expect(response.body.msg).toBe("In the meeting there must be hosts")
        done()
      })
  })

  test("It should response that the hosts mail is incorrect", done => {
    request(app).put("/meeting/" + uuid).set(header, jwt)
      .send({ ...body, "hosts": ["aba@aba.pl", "cccccc.pl"] })
      .then(response => {
        expect(response.statusCode).toBe(404)
        expect(response.body.msg).toBe("These are not valid mails: cccccc.pl")
        done()
      })
  })
  test("It should response that the duration is not integer", done => {
    request(app).put("/meeting/" + uuid).set(header, jwt)
      .send({ ...body, "duration": "ala" })
      .then(response => {
        expect(response.statusCode).toBe(404)
        expect(response.body.msg).toBe("Duration is not proper integer")
        done()
      })
  })
  test("It should send unathorized with no header", done => {
    request(app).put("/meeting/" + uuid)
      .send({ ...body, uuid: uuid })
      .then(response => {
        expect(response.statusCode).toBe(401)
        expect(response.text).toBe("Unauthorized")
        done()
      })
  })
  test("It should send unathorized with bad header", done => {
    request(app).put("/meeting/" + uuid).set(header, "14235151341")
      .send({ ...body, uuid: uuid })
      .then(response => {
        expect(response.statusCode).toBe(401)
        expect(response.text).toBe("Unauthorized")
        done()
      })
  })
  test("It should send unathorized with not meeting organizer header", done => {
    request(app).put("/meeting/" + uuid).set(header, jwt2)
      .send({ ...body, uuid: uuid })
      .then(response => {
        expect(response.statusCode).toBe(403)
        expect(response.text).toBe("Forbidden")
        done()
      })
  })

})

describe("Test the DELETE meeting", () => {


  test("It should send unathorized with no header", done => {
    request(app).delete("/meeting/" + uuid)
      .send({ ...body, uuid: uuid })
      .then(response => {
        expect(response.statusCode).toBe(401)
        expect(response.text).toBe("Unauthorized")
        done()
      })
  })
  test("It should send unathorized with bad header", done => {
    request(app).delete("/meeting/" + uuid).set(header, "14235151341")
      .send({ ...body, uuid: uuid })
      .then(response => {
        expect(response.statusCode).toBe(401)
        expect(response.text).toBe("Unauthorized")
        done()
      })
  })
  test("It should send unathorized with not meeting organizer header", done => {
    request(app).delete("/meeting/" + uuid).set(header, jwt2)
      .send({ ...body, uuid: uuid })
      .then(response => {
        expect(response.statusCode).toBe(403)
        expect(response.text).toBe("Forbidden")
        done()
      })
  })

  test("It should response the correct DELETE", done => {
    request(app).delete("/meeting/" + uuid).set(header, jwt)
      .then(response => {
        expect(response.statusCode).toBe(200)
        expect(response.body.msg).toBe("Meeting deleted")
        done()
      })
  })
  test("It should response the 404", done => {
    request(app).delete("/meeting/" + uuid).set(header, jwt)
      .then(response => {
        expect(response.statusCode).toBe(404)
        expect(response.text).toBe("Not Found")
        done()
      })
  })
})


let body = {
  "duration": 15,
  "hosts": ["aba@aba.pl", "ccc@ccc.pl"],
  "guest": "a@a.pl"
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
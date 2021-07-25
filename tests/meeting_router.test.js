const request = require("supertest");
const db = require("../db/relations")
var {sequelize} = require("../db/sequelizer")
const app = require("../app");

var body = {
    "duration": 15,
    "hosts": ["aba@aba.pl","ccc@ccc.pl"],
    "guest": "a@a.pl"
}

const uuid = "ad18668e-4a28-4565-9f4a-4eace3068a62"


describe("Test the POST meeting", () => {


    beforeAll(async () => {
        await sequelize.sync()
      })
    
    test("It should respone that the meeting was added", done => {
      request(app).post("/meeting")
        .send(body)
        .then(response => {
          expect(response.statusCode).toBe(200)
          expect(response.body.msg).toBe("Meeting added")
          done()
        })
    })
    
    test("It should response that guest mail is incorrect", done => {
      request(app).post("/meeting")
        .send({...body, guest: "aa.pl"})
        .then(response => {
          expect(response.statusCode).toBe(404)
          expect(response.body.msg).toBe("Guest mail is not valid mail")
          done()
        })
    })

    test("It should response that there are no hosts", done => {
      request(app).post("/meeting")
        
        .send({...body, hosts: []})
        .then(response => {
          expect(response.statusCode).toBe(404)
          expect(response.body.msg).toBe("In the meeting there must be hosts")
          done()
        })
    })

    test("It should response that the hosts mail is incorrect", done => {
      request(app).post("/meeting")
        .send({...body, hosts: ["aba@aba.pl","cccccc.pl"]})
        .then(response => {
          expect(response.statusCode).toBe(404)
          expect(response.body.msg).toBe("These are not valid mails: cccccc.pl")
          done()
        })
    })
    test("It should response that the duration is not integer", done => {
      request(app).post("/meeting")
        .send({...body, duration: "ala"})
        .then(response => {
          expect(response.statusCode).toBe(404)
          expect(response.body.msg).toBe("Duration is not proper integer")
          done()
        })
    })
    test("It should response that the uuid is incorrect", done => {
      request(app).post("/meeting")
        .send({...body, uuid: "alazzascxzcx"})
        .then(response => {
          expect(response.statusCode).toBe(404)
          expect(response.body.msg).toBe("Not proper UUID")
          done()
        })
    })


    test("It should respone that the meeting was added with uuid", done => {
        request(app).post("/meeting")
        
        .send({...body, uuid: uuid})
        .then(response => {
            expect(response.statusCode).toBe(200)
            expect(response.body.msg).toBe("Meeting added")
            done()
          })
      })
})

describe("Test the PUT meeting", () => {
    
    test("It should response the correct PUT", done => {
      request(app).put("/meeting/"+uuid)
        
        .send(body)
        .then(response => {
          expect(response.statusCode).toBe(200)
          expect(response.body.msg).toBe("Meeting updated")
          done()
        })
    })
    
    test("It should response that guest mail is incorrect", done => {
      request(app).put("/meeting/"+uuid)
        
        .send({...body, "guest": "aa.pl"})
        .then(response => {
          expect(response.statusCode).toBe(404)
          expect(response.body.msg).toBe("Guest mail is not valid mail")
          done()
        })
    })

    test("It should response that there are no hosts", done => {
      request(app).put("/meeting/"+uuid)
        .send({...body, "hosts": []})
        .then(response => {
          expect(response.statusCode).toBe(404)
          expect(response.body.msg).toBe("In the meeting there must be hosts")
          done()
        })
    })

    test("It should response that the hosts mail is incorrect", done => {
      request(app).put("/meeting/"+uuid)
        .send({...body, "hosts": ["aba@aba.pl","cccccc.pl"]})
        .then(response => {
          expect(response.statusCode).toBe(404)
          expect(response.body.msg).toBe("These are not valid mails: cccccc.pl")
          done()
        })
    })
    test("It should response that the duration is not integer", done => {
      request(app).put("/meeting/"+uuid)
        .send({...body, "duration": "ala"})
        .then(response => {
          expect(response.statusCode).toBe(404)
          expect(response.body.msg).toBe("Duration is not proper integer")
          done()
        })
    })
  })

  describe("Test the DELETE meeting", () => {
    test("It should response the correct DELETE", done => {
        request(app).delete("/meeting/"+uuid)
          .then(response => {
            expect(response.statusCode).toBe(200)
            expect(response.body.msg).toBe("Meeting deleted")
            done()
          })
      })

  })
const amqp_url = process.env.CLOUD_AMQP || "amqp://localhost:5672"

const sendPickedMeetingDate = (meetingUUID, meetingDate, meetingLength) => {
    const amqp = require('amqplib/callback_api')
    amqp.connect(amqp_url, function (connectionError, connection) {
        if (connectionError) throw connectionError
        const queue = "interview"
        connection.createChannel(function (createChannelError, channel) {
            if (createChannelError) throw createChannelError
            result = { meetingUUID, meetingDate, meetingLength }
            const msg = Buffer.from(JSON.stringify(result)).toString('base64')
            channel.sendToQueue(queue, Buffer.from(msg))
        })
        setTimeout(() => {
            connection.close()
        }, 30_000)
    })
}

exports.RabbitService = {
    sendPickedMeetingDate
}
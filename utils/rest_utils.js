const RestUtils = {
    BAD_REQUEST_CODE: 400,
    NOT_FOUND_CODE: 404,
    createResponse: (msg, status = 200) => {
        return {
            msg: msg,
            status: status
        }
    }
}

exports.RestUtils = RestUtils

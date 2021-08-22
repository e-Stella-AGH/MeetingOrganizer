const { RecruitmentServiceVerify } = require('./service_integration/recruitment_service_integration')


const authorizationIntegrations = [RecruitmentServiceVerify]

const verifyToken = async (token) => {
    const promises = authorizationIntegrations
        .map(integration => integration.verifyToken(token))
    const resolvedPromises = await Promise.all(promises)
    const result = resolvedPromises.filter(resolved => resolved !== null)
    return result.length !== 0 ? result[0] : null
}


exports.IntegrationService = { verifyToken: verifyToken }
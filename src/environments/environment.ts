// export const environment = {
//   production: false,
//   apiGateway: 'http://localhost:8080',
//   healthUrl: 'http://localhost:8080/actuator/health',
//   authEndpoint: '/api/auth',
//   apiV1: '/api/v1',
//   voiceEndpoint: '/api/voice',
//   enableLogs: true,
//   initPageUrl: '/init-page'
// };




export const environment = {
  production: false,
  apiGateway: '',                       // ✅ vacío → mismo origen (proxy)
  healthUrl: '/actuator/health',        // ✅ relativo → pasa por el proxy
  authEndpoint: '/api/auth',
  apiV1: '/api/v1',
  voiceEndpoint: '/api/voice',
  enableLogs: true,
  initPageUrl: '/init-page'
};
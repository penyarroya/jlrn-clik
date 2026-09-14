// //export const environment = { production: true };

// export const environment = {
//   production: false,
//   apiGateway: 'http://localhost:8080',
//   healthUrl: 'http://localhost:8080/actuator/health',
//   authEndpoint: '/api/auth',
//   apiV1: '/api/v1',
//   voiceEndpoint: '/api/voice',  // ← CAMBIADO
//   enableLogs: true,
//   initPageUrl: '/init-page'
// };







export const environment = {
  production: true,
  apiGateway: 'https://tu-dominio-produccion.com',           // 👈 cambia cuando tengas dominio real
  healthUrl: 'https://tu-dominio-produccion.com/actuator/health',
  authEndpoint: '/api/auth',
  apiV1: '/api/v1',
  voiceEndpoint: '/api/voice',
  enableLogs: false,                    // 👈 sin logs en prod
  initPageUrl: '/init-page'
};
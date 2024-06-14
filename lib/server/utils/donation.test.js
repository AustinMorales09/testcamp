// "use strict";

// var _axios = _interopRequireDefault(require("axios"));
// var _secrets = _interopRequireDefault(require("../../../configs/secrets"));
// var _fixtures = require("../boot_tests/fixtures");
// var _donation = require("./__mocks__/donation");
// var _donation2 = require("./donation");
// function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// /* eslint-disable camelcase */

// jest.mock('axios');
// const verificationUrl = `https://api.sandbox.paypal.com/v1/notifications/verify-webhook-signature`;
// const tokenUrl = `https://api.sandbox.paypal.com/v1/oauth2/token`;
// const {
//   body: activationHookBody,
//   headers: activationHookHeaders
// } = _donation.mockActivationHook;
// describe('donation', () => {
//   describe('getAsyncPaypalToken', () => {
//     it('call paypal api for token ', async () => {
//       const res = {
//         data: {
//           access_token: 'token'
//         }
//       };
//       _axios.default.post.mockImplementationOnce(() => Promise.resolve(res));
//       await expect((0, _donation2.getAsyncPaypalToken)()).resolves.toEqual(res.data.access_token);
//       expect(_axios.default.post).toHaveBeenCalledTimes(1);
//       expect(_axios.default.post).toHaveBeenCalledWith(tokenUrl, null, {
//         headers: {
//           'Content-Type': 'application/x-www-form-urlencoded'
//         },
//         auth: {
//           username: _secrets.default.paypal.client,
//           password: _secrets.default.paypal.secret
//         },
//         params: {
//           grant_type: 'client_credentials'
//         }
//       });
//     });
//   });
//   describe('verifyWebHook', () => {
//     // normalize headers
//     (0, _donation2.capitalizeKeys)(activationHookHeaders);
//     const mockWebhookId = 'qwdfq;3w12341dfa4';
//     const mockAccessToken = '241231223$!@$#1243';
//     const mockPayLoad = {
//       auth_algo: activationHookHeaders['PAYPAL-AUTH-ALGO'],
//       cert_url: activationHookHeaders['PAYPAL-CERT-URL'],
//       transmission_id: activationHookHeaders['PAYPAL-TRANSMISSION-ID'],
//       transmission_sig: activationHookHeaders['PAYPAL-TRANSMISSION-SIG'],
//       transmission_time: activationHookHeaders['PAYPAL-TRANSMISSION-TIME'],
//       webhook_id: mockWebhookId,
//       webhook_event: activationHookBody
//     };
//     const failedVerificationErr = {
//       message: `Failed token verification.`,
//       type: 'FailedPaypalTokenVerificationError'
//     };
//     const axiosOptions = {
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${mockAccessToken}`
//       }
//     };
//     const successVerificationResponse = {
//       data: {
//         verification_status: 'SUCCESS'
//       }
//     };
//     const failedVerificationResponse = {
//       data: {
//         verification_status: 'FAILED'
//       }
//     };
//     it('calls paypal for Webhook verification', async () => {
//       _axios.default.post.mockImplementationOnce(() => Promise.resolve(successVerificationResponse));
//       await expect((0, _donation2.verifyWebHook)(activationHookHeaders, activationHookBody, mockAccessToken, mockWebhookId)).resolves.toEqual(activationHookBody);
//       expect(_axios.default.post).toHaveBeenCalledWith(verificationUrl, mockPayLoad, axiosOptions);
//     });
//     it('throws error if verification not successful', async () => {
//       _axios.default.post.mockImplementationOnce(() => Promise.resolve(failedVerificationResponse));
//       await expect((0, _donation2.verifyWebHook)(activationHookHeaders, activationHookBody, mockAccessToken, mockWebhookId)).rejects.toEqual(failedVerificationErr);
//     });
//   });
//   describe('updateUser', () => {
//     it('created a donation when a machting user found', () => {
//       (0, _donation2.updateUser)(activationHookBody, _fixtures.mockApp);
//       expect(_fixtures.createDonationMockFn).toHaveBeenCalledTimes(1);
//       expect(_fixtures.createDonationMockFn).toHaveBeenCalledWith((0, _donation2.createDonationObj)(activationHookBody));
//     });
//     it('create a user and donation when no machting user found', () => {
//       let newActivationHookBody = activationHookBody;
//       newActivationHookBody.resource.subscriber.email_address = 'new@freecodecamp.org';
//       (0, _donation2.updateUser)(newActivationHookBody, _fixtures.mockApp);
//       expect(_fixtures.createUserMockFn).toHaveBeenCalledTimes(1);
//     });
//     it('modify user and donation records on cancellation', () => {
//       const {
//         body: cancellationHookBody
//       } = _donation.mockCancellationHook;
//       const {
//         resource: {
//           status_update_time = new Date(Date.now()).toISOString()
//         }
//       } = cancellationHookBody;
//       (0, _donation2.updateUser)(cancellationHookBody, _fixtures.mockApp);
//       expect(_fixtures.updateDonationAttr).toHaveBeenCalledWith({
//         endDate: new Date(status_update_time).toISOString()
//       });
//       expect(_fixtures.updateUserAttr).not.toHaveBeenCalled();
//     });
//   });
// });
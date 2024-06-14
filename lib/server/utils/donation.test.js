"use strict";

var _stripe = _interopRequireDefault(require("stripe"));
var _mongodb = require("mongodb");
var _donation = require("./donation");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/* eslint-disable camelcase */

jest.mock('stripe', () => ({
  checkout: {
    sessions: {
      create: jest.fn()
    }
  }
}));
describe('donation', () => {
  describe('handleStripeCardUpdateSession', () => {
    const mockUserId = (0, _mongodb.ObjectId)('507f1f77bcf86cd799439011');
    const mockDonation = {
      customerId: 'customer_123',
      subscriptionId: 'sub_123'
    };
    const req = {
      user: {
        id: mockUserId
      }
    };
    const app = {
      models: {
        Donation: {
          findOne: jest.fn().mockResolvedValue(mockDonation)
        }
      }
    };
    _stripe.default.checkout.sessions.create.mockResolvedValue({
      id: 'session_123'
    });
    it('creates a session successfully', async () => {
      const result = await (0, _donation.handleStripeCardUpdateSession)(req, app, _stripe.default);
      expect(app.models.Donation.findOne).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          provider: 'stripe'
        }
      });
      expect(_stripe.default.checkout.sessions.create).toHaveBeenCalled();
      expect(result).toEqual({
        sessionId: 'session_123'
      });
    });
    it('throws an error when donation not found', async () => {
      const app = {
        models: {
          Donation: {
            findOne: jest.fn().mockResolvedValue(null)
          }
        }
      };
      await expect((0, _donation.handleStripeCardUpdateSession)(req, app, _stripe.default)).rejects.toThrow('Stripe donation record not found');
    });
    it('handles stripe session creation failure', async () => {
      _stripe.default.checkout.sessions.create.mockRejectedValue(new Error('Stripe error'));
      await expect((0, _donation.handleStripeCardUpdateSession)(req, app, _stripe.default)).rejects.toThrow('Stripe error');
    });
  });
});
import { Handlers } from '@sentry/node';
import { sentry } from '../../../configs/secrets';

export default function sentryRequestHandler() {
  return sentry.dsn === 'dsn_from_sentry_dashboard'
    ? (req, res, next) => next()
    : Handlers.requestHandler();
}

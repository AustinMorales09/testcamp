import MongoStoreFactory from 'connect-mongo';
import session from 'express-session';

const MongoStore = MongoStoreFactory(session);
const sessionSecret = process.env.SESSION_SECRET;
const url = 'mongodb+srv://newUser:test@cluster0.gm6pm.mongodb.net/';
console.log(url)
export default function sessionsMiddleware() {
  return session({
    // 900 day session cookie
    cookie: { maxAge: 900 * 24 * 60 * 60 * 1000 },
    // resave forces session to be resaved
    // regardless of whether it was modified
    // this causes race conditions during parallel req
    resave: false,
    saveUninitialized: true,
    secret: sessionSecret,
    store: new MongoStore({ url })
  });
}

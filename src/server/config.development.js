module.exports = {
  host: 'mongodb+srv://newUser:test@cluster0.gm6pm.mongodb.net/',
  sessionSecret: process.env.SESSION_SECRET,

  github: {
    clientID: process.env.GITHUB_ID,
    clientSecret: process.env.GITHUB_SECRET
  }
};

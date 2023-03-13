const SessionVerify = (req, res, next) => {
  try {
    const user = req.session.user && req.session.user;
    console.log(req.session);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized!" });
    }
    next();
  } catch (error) {
    res.status(401).send({ error: "Please authenticate using a valid token" });
  }
};

module.exports = SessionVerify;

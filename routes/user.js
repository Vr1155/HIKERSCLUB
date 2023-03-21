const express = require("express");

const router = express.Router();

const userControl = require("../controllers/user");

const asyncCatcher = require("../utilities/asyncCatcher");
const passport = require("passport");

router
  .route("/register")
  .get(userControl.showRegister)
  .post(asyncCatcher(userControl.register));

router
  .route("/login")
  .get(userControl.showLogin)
  .post(
    passport.authenticate("local", {
      failureFlash: true,
      failureRedirect: "/login",
      keepSessionInfo: true
    }),
    userControl.login
  );

router.get("/logout", userControl.logout);

module.exports = router;

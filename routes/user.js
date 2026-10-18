const express = require("express");
const router = express.Router();
const passport = require("passport");
const { savedUrl, isLogged } = require("../Middleware/authentication.js");
const userController = require("../controller/user.js");

//signup form    //signup
router
  .route("/signup")
  .get(userController.signupForm)
  .post(savedUrl, userController.signup);
  

//login form    //login
router
  .route("/login")
  .get(userController.loginForm)
  .post(
    savedUrl,
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true,
    }),
    userController.login,
  );

router.get("/dashboard", isLogged, userController.dashboard);

//logout
router.get("/logout", userController.logOut);

module.exports = router;

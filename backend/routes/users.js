const express = require("express");

const router = express.Router();

const isAuthenticated = require("../middleware/isAuthenticated");

router.get("/me", isAuthenticated, (req, res) => {
  res.json({
    success: true,
    user: req.user.toJSON(),
  });
});

module.exports = router;

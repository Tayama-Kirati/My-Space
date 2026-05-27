const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Media routes are ready",
  });
});

module.exports = router;

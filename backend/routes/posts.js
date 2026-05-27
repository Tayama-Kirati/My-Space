const express = require("express");
const router = express.Router();

const postController = require("../controllers/postController");
const isAuthenticated = require("../middleware/isAuthenticated");

router.get("/", postController.getPosts);
router.post("/", isAuthenticated, postController.createPost);
router.patch("/:id", isAuthenticated, postController.updatePost);
router.patch("/:id/publish", isAuthenticated, postController.publishPost);
router.delete("/:id", isAuthenticated, postController.deletePost);

module.exports = router;

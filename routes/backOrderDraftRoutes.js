const express = require("express");
const router = express.Router();
const backOrderDraftController = require("../controllers/backOrderDraftController");

router.get("/:userId", backOrderDraftController.getDraft);
router.post("/", backOrderDraftController.saveDraft);
router.delete("/:userId", backOrderDraftController.deleteDraft);

module.exports = router;

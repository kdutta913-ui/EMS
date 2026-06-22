const express = require("express");
const router  = express.Router();
const {
  getDocuments, createDocument, updateDocument, deleteDocument,
} = require("../controllers/documentControllers");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);
router.use(authorize("CompanyAdmin", "HR"));

router.get("/",    getDocuments);
router.post("/",   createDocument);
router.put("/:id", updateDocument);
router.delete("/:id", deleteDocument);

module.exports = router;

const UserModel = require("../models/user.model");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const pipeline = promisify(require("stream").pipeline);
const { uploadErrors } = require("../utils/errors.utils");

module.exports.uploadProfil = async (req, res) => {
  try {
    if (!req.file) throw Error("No file");
    if (req.file.size > 500000) throw Error("max size");
  } catch (err) {
    const errors = uploadErrors(err);
    return res.status(400).json(errors);
  }

  const fileName = req.body.name + ".jpg";
  const savePath = `${__dirname}/../client/public/uploads/profil/${fileName}`;

  // Create the directory if it doesn't exist
  fs.mkdirSync(path.dirname(savePath), { recursive: true });

  try {
    await pipeline(
      fs.createReadStream(req.file.path),
      fs.createWriteStream(savePath)
    );
    // Delete the temporary file
    fs.unlinkSync(req.file.path);
  } catch (err) {
    // In case of any error, delete the temporary file
    fs.unlinkSync(req.file.path);
    return res.status(500).send({ message: err.message });
  }

  try {
    await UserModel.findByIdAndUpdate(
      req.body.userId,
      { $set: { picture: "./uploads/profil/" + fileName } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return res.send({ message: "Upload successful" });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

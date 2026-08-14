const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.send("Server is working!");
});

const server = app.listen(5000, () => {
  console.log("TEST SERVER RUNNING ON PORT 5000");
});

server.on("close", () => {
  console.log("TEST SERVER CLOSED");
});

server.on("error", (err) => {
  console.log("TEST SERVER ERROR:", err);
});
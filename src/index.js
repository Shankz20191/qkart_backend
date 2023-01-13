const mongoose = require("mongoose");
const app = require("./app");
const config = require("./config/config");

let server;

mongoose.connect(config.mongoose.url, config.mongoose.options, () => {
    console.log("MongoDB Connected");
    app.listen(config.port, () => {
        console.log("App connected to port", config.port);
    })
}, (err) => {
    console.log(err);
});

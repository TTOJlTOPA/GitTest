let express = require("express");
let app = express();

app.use(express.static("public"));
app.get("/aaaand_it's_gone", function (req, res) {
    res.send("I hope is's works.");
});

app.listen(3000);

import express from "express";

const app = express();
const port = parseInt(process.env.PORT || "55019");

app.listen(port, () => {
    console.log(`App listening on ${port}`);
});

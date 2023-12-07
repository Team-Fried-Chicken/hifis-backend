const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const port = 3001;

const app = express();
app.use(cors());

const db = mysql.createConnection({
	host: "localhost",
	port: 3306,
	user: "root",
	password: "hifis-password",
	database: "Hifis",
});

app.get("/questions", (req, res) => {
	const sql = "SELECT * FROM HIFIS_PiTQuestions";
	db.query(sql, (err, data) => {
		if (err) return res.json(err);
		return res.json(data);
	});
});

app.get("/", (req, res) => {
	return res.json("From Backend");
});

app.listen(port, () => {
	console.log("listening");
});

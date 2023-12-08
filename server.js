const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
require("body-parser");
require("dotenv").config();
const port = 3001;

const app = express();

app.use(bodyParser.json());
app.use(
	bodyParser.urlencoded({
		extended: true,
	})
);

app.use(cors());

const db = mysql.createConnection({
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_DATABASE,
});

app.post("/login", (req, res) => {
	console.log("Request Body:", req.body);
	const sql =
		"SELECT * FROM hifis_pitusers WHERE `username` = ? AND `password` = ?";

	// Use parameterized query to prevent SQL injection
	db.query(sql, [req.body.username, req.body.password], (err, data) => {
		if (err) {
			console.error("Error executing query:", err);
			return res.status(500).json({ message: "Internal server error" });
		}
		if (data.length > 0) {
			const userId = data[0].userId;
			const token = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
				expiresIn: "1h",
			});
			return res.json({ login: true, accessToken: token });
		} else {
			return res.json({ login: false, message: "Invalid credentials" });
		}
	});
});

app.get("/questions", (req, res) => {
	const sql = "SELECT * FROM HIFIS_PiTQuestions";
	db.query(sql, (err, data) => {
		if (err) {
			console.error("Error executing query:", err);
			return res.status(500).json({ message: "Internal server error" });
		}
		return res.json(data);
	});
});

app.get("/", (req, res) => {
	return res.json("From Backend");
});

function authenticateToken(req, res, next) {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1];
	if (token == null) return res.sendStatus(401);

	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
		if (err) return res.sendStatus(403);
		req.user = user;
		next();
	});
}

app.listen(port, () => {
	console.log("listening");
});

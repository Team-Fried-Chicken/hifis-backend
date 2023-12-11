const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
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

app.post("/api/login", (req, res) => {
	console.log("Request Body:", req.body);

	const sql =
		"SELECT * FROM hifis_pitusers WHERE `name` = ? AND `password` = ?";

	// Use parameterized query to prevent SQL injection
	db.query(sql, [req.body.username, req.body.password], (err, data) => {
		if (err) {
			console.error("Error executing query:", err);
			return res.status(500).json({ message: "Internal server error" });
		}

		if (data.length > 0) {
			const user = data[0];
			const userId = user.user_id;
			const username = user.name;
			const token = jwt.sign(
				{ userId, username },
				process.env.ACCESS_TOKEN_SECRET,
				{
					expiresIn: "1h",
				}
			);
			return res.json({
				login: true,
				accessToken: token,
				user: { userId, username },
			});
		} else {
			// If no matching user is found, return an error message
			return res
				.status(401)
				.json({ login: false, message: "Invalid credentials" });
		}
	});
});

app.get("/api/pitsurvey", authenticateToken, (req, res) => {
	const sql = "SELECT * FROM hifis_pitsurvey";
	db.query(sql, (err, data) => {
		if (err) {
			console.error("Error executing query:", err);
			return res.status(500).json({ message: "Internal server error" });
		}
		return res.json(data);
	});
});

//Get the predicted primary key for inserting a new survey
app.get("/api/predictedSurveyNo", authenticateToken, (req, res) => {
	const sql = "SELECT MAX(SurveyNo) AS maxSurveyNo FROM hifis_pitsurvey";

	db.query(sql, (err, result) => {
		if (err) {
			console.error("Error executing query:", err);
			return res.status(500).json({ message: "Internal server error" });
		}

		const maxSurveyNo = result[0].maxSurveyNo || 0;
		const predictedSurveyNo = maxSurveyNo + 1;

		return res.json({ predictedSurveyNo });
	});
});

app.get("/api/questions", (req, res) => {
	const sql = "SELECT * FROM hifis_pitquestions";
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

	if (!token) {
		return res.sendStatus(401);
	}

	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
		if (err) {
			console.error("Token Verification Error:", err);
			return res.sendStatus(403);
		}

		req.user = user;
		next();
	});
}

app.listen(port, () => {
	console.log("listening");
});

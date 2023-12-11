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

app.post("/auth/login", (req, res) => {
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
			return res.json({ login: true, accessToken: token });
		} else {
			// If no matching user is found, return an error message
			return res
				.status(401)
				.json({ login: false, message: "Invalid credentials" });
		}
	});
});

app.get("/auth/pitsurvey", (req, res) => {
	const sql = "SELECT * FROM hifis_pitsurvey";
	db.query(sql, (err, data) => {
		if (err) {
			console.error("Error executing query:", err);
			return res.status(500).json({ message: "Internal server error" });
		}
		Console.Log(data);
		return res.json(data);
	});
});

app.get("/auth/questions", (req, res) => {
	const sql = "SELECT q.QuestionID, qt.NameE AS Type, q.Question, q.SequenceNo, q.ActivatedBy, q.Type AS Category FROM HIFIS_PiTQuestions q JOIN HIFIS_PiTQuestionTypes qt ON q.QuestionTypeID = qt.ID ORDER BY q.SequenceNo";
	db.query(sql, (err, data) => {
		if (err) {
			console.error("Error executing query:", err);
			return res.status(500).json({ message: "Internal server error" });
		}
		let newData = [];
		for (let i = 0; i < data.length; i++) {
			let aData = {
				QuestionID: data[i].QuestionID,
				Type: data[i].Type,
				Question: data[i].Question,
				SequenceNo: data[i].SequenceNo,
				ActivatedBy: data[i].ActivatedBy,
				Category: data[i].Category,
				Subquestion: []
			}

			if (data[i].ActivatedBy !== null) {
				let activatedByItem = newData.find(item => item.QuestionID === data[i].ActivatedBy);
			
				if (activatedByItem) {
				  activatedByItem.Subquestion.push(aData);
				}
			  } else {
				newData.push(aData);
			  }
		}

		return res.json(newData);
	});
});

app.get("/auth/answers", (req, res) => {
	const sql = "SELECT dd.QuestionPickListID AS OptionID, dd.QuestionID, dd.Name AS Options, ddat.NameE AS Actions FROM HIFIS_PiTQuestionDropDown dd LEFT JOIN HIFIS_PiTDropDownActionTypes ddat ON dd.DropDownActionTypeID = ddat.ID";
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

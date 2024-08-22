const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    process.exit(1);
  }
  console.log("Connected to the database.");
});

app.post("/addSchool", (req, res) => {
  const { name, address, latitude, longitude } = req.body;
  if (!name || !address || !latitude || !longitude) {
    return res
      .status(400)
      .json({ error: "Please provide all required fields" });
  }

  const query =
    "INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)";
  db.query(query, [name, address, latitude, longitude], (err, result) => {
    if (err) {
      console.error("Error inserting school:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.status(201).json({ message: "School added successfully." });
  });
});

app.get("/listSchools", (req, res) => {
  const { latitude, longitude } = req.query;
  if (!latitude || !longitude) {
    return res.status(400).send("Latitude and longitude are required.");
  }

  const userLat = parseFloat(latitude);
  const userLng = parseFloat(longitude);

  const query = "SELECT id, name, address, latitude, longitude FROM schools";
  db.execute(query, [], (err, results) => {
    if (err) {
      return res.status(500).send("Error fetching data from database.");
    }

    const schools = results.map((school) => {
      const distance = Math.sqrt(
        Math.pow(school.latitude - userLat, 2) +
          Math.pow(school.longitude - userLng, 2)
      );
      return { ...school, distance };
    });

    schools.sort((a, b) => a.distance - b.distance);

    res.json(schools);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

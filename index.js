const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2/promise");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

app.post("/addSchool", async (req, res) => {
  const { name, address, latitude, longitude } = req.body;
  if (!name || !address || !latitude || !longitude) {
    return res
      .status(400)
      .json({ error: "Please provide all required fields" });
  }

  try {
    const [result] = await db.execute(
      "INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)",
      [name, address, latitude, longitude]
    );
    res.status(201).json({ message: "School added successfully." });
  } catch (err) {
    console.error("Error inserting school:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/listSchools", async (req, res) => {
  const { latitude, longitude } = req.query;
  if (!latitude || !longitude) {
    return res.status(400).send("Latitude and longitude are required.");
  }

  const userLat = parseFloat(latitude);
  const userLng = parseFloat(longitude);

  try {
    const [results] = await db.execute(
      "SELECT id, name, address, latitude, longitude FROM schools"
    );
    const schools = results.map((school) => {
      const distance = Math.sqrt(
        Math.pow(school.latitude - userLat, 2) +
          Math.pow(school.longitude - userLng, 2)
      );
      return { ...school, distance };
    });

    schools.sort((a, b) => a.distance - b.distance);

    res.json(schools);
  } catch (err) {
    console.error("Error fetching data from database:", err);
    res.status(500).send("Error fetching data from database.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

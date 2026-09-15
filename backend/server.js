const express = require("express");
const cors = require("cors");
const prisma = require("./db");
const leaveRoutes = require("./routes/leaveRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/leaves", leaveRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Leave Management API is running",
  });
});

app.get("/api/employees", async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: {
        id: "asc",
      },
    });

    res.json(employees);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch employees",
    });
  }
});

app.get("/api/employees/:id", async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: {
        id: Number(req.params.id),
      },
    });

    if (!employee) {
      return res.status(404).json({
        error: "Employee not found",
      });
    }

    res.json(employee);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch employee",
    });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
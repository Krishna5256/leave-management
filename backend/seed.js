const prisma = require("./db");

const employees = [
  {
    name: "Rahul Sharma",
    email: "rahul@example.com",
    department: "Engineering",
  },
  {
    name: "Priya Kumar",
    email: "priya@example.com",
    department: "Human Resources",
  },
  {
    name: "Arjun Rao",
    email: "arjun@example.com",
    department: "Engineering",
  },
  {
    name: "Sneha Reddy",
    email: "sneha@example.com",
    department: "Finance",
  },
  {
    name: "Kiran Kumar",
    email: "kiran@example.com",
    department: "Engineering",
  },
  {
    name: "Ananya Singh",
    email: "ananya@example.com",
    department: "Marketing",
  },
  {
    name: "Rohit Verma",
    email: "rohit@example.com",
    department: "Engineering",
  },
  {
    name: "Neha Patel",
    email: "neha@example.com",
    department: "Operations",
  },
  {
    name: "Vivek Nair",
    email: "vivek@example.com",
    department: "Engineering",
  },
  {
    name: "Pooja Iyer",
    email: "pooja@example.com",
    department: "Human Resources",
  },
];

async function main() {
  for (const employee of employees) {
    await prisma.employee.upsert({
      where: {
        email: employee.email,
      },
      update: {},
      create: employee,
    });
  }

  console.log("10 employees created successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
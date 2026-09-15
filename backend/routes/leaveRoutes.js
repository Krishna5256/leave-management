const express = require("express");
const prisma = require("../db");

const router = express.Router();

// Apply for leave
router.post("/", async (req, res) => {
  try {
    const {
      employeeId,
      fromDate,
      toDate,
      leaveType,
      reason,
    } = req.body;

    // Validate required fields
    if (
      !employeeId ||
      !fromDate ||
      !toDate ||
      !leaveType ||
      !reason
    ) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    // Validate employee
    const employee = await prisma.employee.findUnique({
      where: {
        id: Number(employeeId),
      },
    });

    if (!employee) {
      return res.status(404).json({
        error: "Employee not found",
      });
    }

    // Convert dates
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        error: "Invalid date",
      });
    }

    if (endDate < startDate) {
      return res.status(400).json({
        error: "To Date cannot be before From Date",
      });
    }

    // Calculate number of days
    const difference =
      endDate.getTime() - startDate.getTime();

    const days =
      Math.floor(difference / (1000 * 60 * 60 * 24)) + 1;

    // Validate leave type
    const validLeaveTypes = ["ANNUAL", "SICK", "CASUAL"];

    if (!validLeaveTypes.includes(leaveType)) {
      return res.status(400).json({
        error: "Invalid leave type",
      });
    }

    // Check available balance
    let availableBalance;

    if (leaveType === "ANNUAL") {
      availableBalance = employee.annualLeaveBalance;
    } else if (leaveType === "SICK") {
      availableBalance = employee.sickLeaveBalance;
    } else {
      availableBalance = employee.casualLeaveBalance;
    }

    if (days > availableBalance) {
      return res.status(400).json({
        error: "Insufficient leave balance",
        availableBalance,
        requestedDays: days,
      });
    }

    // Create leave request
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId: Number(employeeId),
        fromDate: startDate,
        toDate: endDate,
        leaveType,
        reason,
        days,
        status: "PENDING",
      },
    });

    res.status(201).json({
      success: true,
      message: "Leave request submitted successfully",
      leaveRequest,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to submit leave request",
    });
  }
});
// Get all leave requests
router.get("/", async (req, res) => {
  try {
    const leaveRequests = await prisma.leaveRequest.findMany({
      include: {
        employee: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(leaveRequests);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch leave requests",
    });
  }
});
// Get leave history for a specific employee
router.get("/employee/:employeeId", async (req, res) => {
  try {
    const employeeId = Number(req.params.employeeId);

    const employee = await prisma.employee.findUnique({
      where: {
        id: employeeId,
      },
    });

    if (!employee) {
      return res.status(404).json({
        error: "Employee not found",
      });
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        employeeId: employeeId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
      },
      leaveHistory: leaveRequests,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch employee leave history",
    });
  }
});
// Approve a leave request
router.put("/:id/approve", async (req, res) => {
  try {
    const leaveId = Number(req.params.id);

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: {
        id: leaveId,
      },
      include: {
        employee: true,
      },
    });

    if (!leaveRequest) {
      return res.status(404).json({
        error: "Leave request not found",
      });
    }

    // Prevent approving an already processed request
    if (leaveRequest.status !== "PENDING") {
      return res.status(400).json({
        error: `Leave request is already ${leaveRequest.status}`,
      });
    }

    const employee = leaveRequest.employee;

    let currentBalance;

    if (leaveRequest.leaveType === "ANNUAL") {
      currentBalance = employee.annualLeaveBalance;
    } else if (leaveRequest.leaveType === "SICK") {
      currentBalance = employee.sickLeaveBalance;
    } else {
      currentBalance = employee.casualLeaveBalance;
    }

    // Double-check balance before approval
    if (leaveRequest.days > currentBalance) {
      return res.status(400).json({
        error: "Insufficient leave balance",
        availableBalance: currentBalance,
        requestedDays: leaveRequest.days,
      });
    }

    // Update employee balance and leave status
    const result = await prisma.$transaction(async (tx) => {
      let updatedEmployee;

      if (leaveRequest.leaveType === "ANNUAL") {
        updatedEmployee = await tx.employee.update({
          where: {
            id: employee.id,
          },
          data: {
            annualLeaveBalance: {
              decrement: leaveRequest.days,
            },
          },
        });
      } else if (leaveRequest.leaveType === "SICK") {
        updatedEmployee = await tx.employee.update({
          where: {
            id: employee.id,
          },
          data: {
            sickLeaveBalance: {
              decrement: leaveRequest.days,
            },
          },
        });
      } else {
        updatedEmployee = await tx.employee.update({
          where: {
            id: employee.id,
          },
          data: {
            casualLeaveBalance: {
              decrement: leaveRequest.days,
            },
          },
        });
      }

      const updatedLeave = await tx.leaveRequest.update({
        where: {
          id: leaveId,
        },
        data: {
          status: "APPROVED",
        },
      });

      return {
        employee: updatedEmployee,
        leaveRequest: updatedLeave,
      };
    });

    res.json({
      success: true,
      message: "Leave request approved successfully",
      result,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to approve leave request",
    });
  }
});
// Reject a leave request
router.put("/:id/reject", async (req, res) => {
  try {
    const leaveId = Number(req.params.id);

    // Find the leave request
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: {
        id: leaveId,
      },
    });

    // Check whether the request exists
    if (!leaveRequest) {
      return res.status(404).json({
        error: "Leave request not found",
      });
    }

    // Only pending requests can be rejected
    if (leaveRequest.status !== "PENDING") {
      return res.status(400).json({
        error: `Leave request is already ${leaveRequest.status}`,
      });
    }

    // Change status to REJECTED
    const updatedLeave = await prisma.leaveRequest.update({
      where: {
        id: leaveId,
      },
      data: {
        status: "REJECTED",
      },
    });

    res.json({
      success: true,
      message: "Leave request rejected successfully",
      leaveRequest: updatedLeave,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to reject leave request",
    });
  }
});
module.exports = router;
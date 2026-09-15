"use client";

import { useEffect, useState } from "react";

const API_URL = "https://leave-management-if13.onrender.com";

type Employee = {
  id: number;
  name: string;
  email: string;
  department: string;
  annualLeaveBalance: number;
  sickLeaveBalance: number;
  casualLeaveBalance: number;
};

type LeaveRequest = {
  id: number;
  employeeId: number;
  fromDate: string;
  toDate: string;
  leaveType: string;
  reason: string;
  days: number;
  status: string;
};

export default function Home() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] =
    useState<Employee | null>(null);

  const [leaveHistory, setLeaveHistory] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [leaveType, setLeaveType] = useState("ANNUAL");
  const [reason, setReason] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadEmployees();
  }, []);

  async function loadEmployees() {
    try {
      const response = await fetch(`${API_URL}/api/employees`);
      const data = await response.json();

      setEmployees(data);

      if (data.length > 0) {
        setSelectedEmployee(data[0]);
        await loadLeaveHistory(data[0].id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function loadLeaveHistory(employeeId: number) {
    try {
      const response = await fetch(
        `${API_URL}/api/leaves/employee/${employeeId}`
      );

      const data = await response.json();

      setLeaveHistory(data.leaveHistory || []);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleEmployeeChange(employeeId: number) {
    const employee = employees.find(
      (item) => item.id === employeeId
    );

    if (employee) {
      setSelectedEmployee(employee);
      await loadLeaveHistory(employee.id);
    }
  }

  function calculateDays() {
    if (!fromDate || !toDate) return 0;

    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (end < start) return 0;

    const difference =
      end.getTime() - start.getTime();

    return (
      Math.floor(
        difference / (1000 * 60 * 60 * 24)
      ) + 1
    );
  }

  async function handleSubmitLeave(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (!selectedEmployee) return;

    setMessage("");

    if (!fromDate || !toDate || !reason) {
      setMessage("Please fill all fields.");
      return;
    }

    if (new Date(toDate) < new Date(fromDate)) {
      setMessage(
        "To Date cannot be before From Date."
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `${API_URL}/api/leaves`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employeeId: selectedEmployee.id,
            fromDate,
            toDate,
            leaveType,
            reason,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Failed to submit leave.");
        return;
      }

      setMessage(
        "Leave request submitted successfully!"
      );

      setFromDate("");
      setToDate("");
      setLeaveType("ANNUAL");
      setReason("");

      await loadLeaveHistory(selectedEmployee.id);

      setTimeout(() => {
        setShowForm(false);
        setMessage("");
      }, 1500);
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to the server.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Loading...
      </main>
    );
  }

  if (!selectedEmployee) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        No employees found.
      </main>
    );
  }

  const requestedDays = calculateDays();

  return (
    <main className="min-h-screen bg-gray-100">
      {/* HEADER */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Leave Management System
            </h1>

            <p className="text-sm text-gray-500">
              Employee Portal
            </p>
          </div>

          <select
            value={selectedEmployee.id}
            onChange={(e) =>
              handleEmployeeChange(
                Number(e.target.value)
              )
            }
            className="border rounded-lg px-4 py-2 bg-white"
          >
            {employees.map((employee) => (
              <option
                key={employee.id}
                value={employee.id}
              >
                {employee.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* MAIN */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        <div className="mb-8">
          <h2 className="text-3xl font-bold">
            Welcome, {selectedEmployee.name}
          </h2>

          <p className="text-gray-500 mt-1">
            {selectedEmployee.department} •{" "}
            {selectedEmployee.email}
          </p>
        </div>

        {/* BALANCE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <p className="text-gray-500">
              Annual Leave
            </p>

            <p className="text-4xl font-bold mt-2">
              {selectedEmployee.annualLeaveBalance}
            </p>

            <p className="text-sm text-gray-400">
              days available
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <p className="text-gray-500">
              Sick Leave
            </p>

            <p className="text-4xl font-bold mt-2">
              {selectedEmployee.sickLeaveBalance}
            </p>

            <p className="text-sm text-gray-400">
              days available
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <p className="text-gray-500">
              Casual Leave
            </p>

            <p className="text-4xl font-bold mt-2">
              {selectedEmployee.casualLeaveBalance}
            </p>

            <p className="text-sm text-gray-400">
              days available
            </p>
          </div>
        </div>

        {/* APPLY LEAVE */}
        <div className="bg-white rounded-xl border shadow-sm p-6 mb-8">

          <div className="flex items-center justify-between">

            <div>
              <h3 className="text-xl font-semibold">
                Apply for Leave
              </h3>

              <p className="text-gray-500 mt-1">
                Submit a new leave request.
              </p>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-black text-white px-5 py-3 rounded-lg hover:bg-gray-800"
            >
              {showForm
                ? "Close Form"
                : "Apply for Leave"}
            </button>
          </div>

          {showForm && (
            <form
              onSubmit={handleSubmitLeave}
              className="mt-6 border-t pt-6"
            >

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* FROM */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    From Date
                  </label>

                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) =>
                      setFromDate(e.target.value)
                    }
                    className="w-full border rounded-lg px-4 py-3"
                    required
                  />
                </div>

                {/* TO */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    To Date
                  </label>

                  <input
                    type="date"
                    value={toDate}
                    min={fromDate}
                    onChange={(e) =>
                      setToDate(e.target.value)
                    }
                    className="w-full border rounded-lg px-4 py-3"
                    required
                  />
                </div>

                {/* TYPE */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Leave Type
                  </label>

                  <select
                    value={leaveType}
                    onChange={(e) =>
                      setLeaveType(e.target.value)
                    }
                    className="w-full border rounded-lg px-4 py-3"
                  >
                    <option value="ANNUAL">
                      Annual Leave
                    </option>

                    <option value="SICK">
                      Sick Leave
                    </option>

                    <option value="CASUAL">
                      Casual Leave
                    </option>
                  </select>
                </div>

                {/* DAYS */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Requested Days
                  </label>

                  <div className="w-full border rounded-lg px-4 py-3 bg-gray-50">
                    {requestedDays || "-"} days
                  </div>
                </div>

                {/* REASON */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Reason
                  </label>

                  <textarea
                    value={reason}
                    onChange={(e) =>
                      setReason(e.target.value)
                    }
                    placeholder="Enter reason for leave"
                    rows={4}
                    className="w-full border rounded-lg px-4 py-3"
                    required
                  />
                </div>
              </div>

              {message && (
                <div className="mt-5 bg-gray-100 rounded-lg p-4">
                  {message}
                </div>
              )}

              <div className="mt-5 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-black text-white px-6 py-3 rounded-lg disabled:opacity-50"
                >
                  {submitting
                    ? "Submitting..."
                    : "Submit Leave Request"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* HISTORY */}
        <div className="bg-white rounded-xl border shadow-sm">

          <div className="p-6 border-b">
            <h3 className="text-xl font-semibold">
              Leave History
            </h3>

            <p className="text-gray-500 text-sm mt-1">
              Your previous leave requests
            </p>
          </div>

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-4">
                    From
                  </th>

                  <th className="text-left px-6 py-4">
                    To
                  </th>

                  <th className="text-left px-6 py-4">
                    Type
                  </th>

                  <th className="text-left px-6 py-4">
                    Days
                  </th>

                  <th className="text-left px-6 py-4">
                    Reason
                  </th>

                  <th className="text-left px-6 py-4">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {leaveHistory.map((leave) => (
                  <tr
                    key={leave.id}
                    className="border-t"
                  >
                    <td className="px-6 py-4">
                      {new Date(
                        leave.fromDate
                      ).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4">
                      {new Date(
                        leave.toDate
                      ).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4">
                      {leave.leaveType}
                    </td>

                    <td className="px-6 py-4">
                      {leave.days}
                    </td>

                    <td className="px-6 py-4">
                      {leave.reason}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          leave.status === "APPROVED"
                            ? "bg-green-100 text-green-700"
                            : leave.status === "REJECTED"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {leave.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {leaveHistory.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-10 text-gray-500"
                    >
                      No leave history found.
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

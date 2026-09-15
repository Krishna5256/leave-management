"use client";

import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000";

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
  employee: Employee;
};

export default function AdminPage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] =
    useState<number | null>(null);

  const [message, setMessage] = useState("");

  useEffect(() => {
    loadLeaves();
  }, []);

  async function loadLeaves() {
    try {
      const response = await fetch(
        `${API_URL}/api/leaves`
      );

      const data = await response.json();

      setLeaves(data);
    } catch (error) {
      console.error(error);
      setMessage(
        "Unable to load leave requests."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(
    id: number,
    action: "approve" | "reject"
  ) {
    try {
      setProcessingId(id);
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/leaves/${id}/${action}`,
        {
          method: "PUT",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            `Failed to ${action} leave request.`
        );
        return;
      }

      setMessage(
        action === "approve"
          ? "Leave request approved successfully."
          : "Leave request rejected successfully."
      );

      await loadLeaves();
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to connect to the backend."
      );
    } finally {
      setProcessingId(null);
    }
  }

  const pendingCount = leaves.filter(
    (leave) => leave.status === "PENDING"
  ).length;

  const approvedCount = leaves.filter(
    (leave) => leave.status === "APPROVED"
  ).length;

  const rejectedCount = leaves.filter(
    (leave) => leave.status === "REJECTED"
  ).length;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Loading admin dashboard...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">

      {/* HEADER */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Leave Management System
            </h1>

            <p className="text-sm text-gray-500">
              Admin / Manager Portal
            </p>
          </div>

          <a
            href="/"
            className="border px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            Employee Portal
          </a>

        </div>
      </header>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        <div className="mb-8">
          <h2 className="text-3xl font-bold">
            Admin Dashboard
          </h2>

          <p className="text-gray-500 mt-1">
            Review and manage employee leave requests.
          </p>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">

          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <p className="text-gray-500 text-sm">
              Total Requests
            </p>

            <p className="text-4xl font-bold mt-2">
              {leaves.length}
            </p>
          </div>

          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <p className="text-gray-500 text-sm">
              Pending
            </p>

            <p className="text-4xl font-bold mt-2">
              {pendingCount}
            </p>
          </div>

          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <p className="text-gray-500 text-sm">
              Approved
            </p>

            <p className="text-4xl font-bold mt-2">
              {approvedCount}
            </p>
          </div>

          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <p className="text-gray-500 text-sm">
              Rejected
            </p>

            <p className="text-4xl font-bold mt-2">
              {rejectedCount}
            </p>
          </div>

        </div>

        {/* MESSAGE */}
        {message && (
          <div className="bg-white border rounded-xl p-4 mb-6">
            {message}
          </div>
        )}

        {/* REQUESTS */}
        <div className="bg-white rounded-xl border shadow-sm">

          <div className="p-6 border-b">
            <h3 className="text-xl font-semibold">
              Leave Requests
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Review employee leave applications.
            </p>
          </div>

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-gray-50">

                <tr>

                  <th className="text-left px-5 py-4 text-sm">
                    Employee
                  </th>

                  <th className="text-left px-5 py-4 text-sm">
                    Department
                  </th>

                  <th className="text-left px-5 py-4 text-sm">
                    From
                  </th>

                  <th className="text-left px-5 py-4 text-sm">
                    To
                  </th>

                  <th className="text-left px-5 py-4 text-sm">
                    Type
                  </th>

                  <th className="text-left px-5 py-4 text-sm">
                    Days
                  </th>

                  <th className="text-left px-5 py-4 text-sm">
                    Reason
                  </th>

                  <th className="text-left px-5 py-4 text-sm">
                    Status
                  </th>

                  <th className="text-left px-5 py-4 text-sm">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {leaves.map((leave) => (

                  <tr
                    key={leave.id}
                    className="border-t"
                  >

                    <td className="px-5 py-4 font-medium">
                      {leave.employee.name}
                    </td>

                    <td className="px-5 py-4">
                      {leave.employee.department}
                    </td>

                    <td className="px-5 py-4">
                      {new Date(
                        leave.fromDate
                      ).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-4">
                      {new Date(
                        leave.toDate
                      ).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-4">
                      {leave.leaveType}
                    </td>

                    <td className="px-5 py-4">
                      {leave.days}
                    </td>

                    <td className="px-5 py-4">
                      {leave.reason}
                    </td>

                    <td className="px-5 py-4">

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

                    <td className="px-5 py-4">

                      {leave.status === "PENDING" ? (

                        <div className="flex gap-2">

                          <button
                            onClick={() =>
                              handleAction(
                                leave.id,
                                "approve"
                              )
                            }
                            disabled={
                              processingId === leave.id
                            }
                            className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                          >
                            Approve
                          </button>

                          <button
                            onClick={() =>
                              handleAction(
                                leave.id,
                                "reject"
                              )
                            }
                            disabled={
                              processingId === leave.id
                            }
                            className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                          >
                            Reject
                          </button>

                        </div>

                      ) : (

                        <span className="text-gray-400 text-sm">
                          No action
                        </span>

                      )}

                    </td>

                  </tr>

                ))}

                {leaves.length === 0 && (

                  <tr>
                    <td
                      colSpan={9}
                      className="text-center py-10 text-gray-500"
                    >
                      No leave requests found.
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
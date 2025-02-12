import React, { useState } from "react";
import { Menu, Users, BarChart, ChevronLeft } from "lucide-react";

const AdminDashboard = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("users");
  
  // Sample user data - replace with actual data
  const [usersList] = useState([
    { id: 1, name: "John Doe", email: "john@example.com", role: "HR", status: "Active" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "Panel", status: "Active" }
  ]);

  const menuItems = [
    { id: "users", icon: <Users />, label: "Manage Users" },
    { id: "reports", icon: <BarChart />, label: "Reports" }
  ];

  const FormField = ({ label, type = "text", ...props }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <input
        type={type}
        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
        {...props}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <button
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 text-white rounded-lg"
      >
        <Menu />
      </button>

      <aside
        className={`fixed top-0 left-0 h-full bg-slate-800 text-white transition-all duration-300 ease-in-out z-40 
          ${isSidebarOpen ? 'w-64' : 'w-0 md:w-20'}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          {isSidebarOpen && <h2 className="text-xl font-bold">Admin Panel</h2>}
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="hidden md:block"
          >
            <ChevronLeft />
          </button>
        </div>

        <nav className="mt-6 space-y-2 px-2">
          {menuItems.map(({ id, icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center p-3 rounded-lg transition-colors
                ${activeTab === id ? "bg-blue-600" : "hover:bg-slate-700"}`}
            >
              {icon}
              {isSidebarOpen && <span className="ml-3">{label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <main className={`transition-all duration-300 p-4 md:p-8 
        ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
        <div className="bg-white rounded-2xl shadow-sm mt-12 md:mt-0">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-800">
              {activeTab === "users" ? "Manage Users" : "User Reports"}
            </h2>
          </div>
          
          <div className="p-6">
            {activeTab === "users" && (
              <div className="space-y-6">
                {/* Create User Form */}
                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                  <h3 className="text-lg font-medium mb-4">Create New User</h3>
                  <div className="space-y-4">
                    <FormField label="Full Name" placeholder="Enter full name" />
                    <FormField label="Email" type="email" placeholder="Enter email" />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                      <select className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                        <option value="">Select role</option>
                        <option value="HR">HR</option>
                        <option value="Panel">Panel Member</option>
                      </select>
                    </div>
                    <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full md:w-auto">
                      Create User
                    </button>
                  </div>
                </div>

                {/* Users List */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {usersList.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{user.role}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button className="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
                            <button className="text-red-600 hover:text-red-800">Deactivate</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "reports" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium mb-2">Total Users</h3>
                    <p className="text-3xl font-bold text-blue-600">{usersList.length}</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium mb-2">HR Members</h3>
                    <p className="text-3xl font-bold text-green-600">
                      {usersList.filter(user => user.role === "HR").length}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium mb-2">Panel Members</h3>
                    <p className="text-3xl font-bold text-indigo-600">
                      {usersList.filter(user => user.role === "Panel").length}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
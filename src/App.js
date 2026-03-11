// App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { AuthProvider } from "./contexts/AuthContext";
import { DashboardProvider } from "./contexts/DashboardContext";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";
import Login from "./components/auth/Login";
import Dashboard from "./pages/Dashboard";
import TotalVisitsPage from "./pages/TotalVisits";
import Registration from "./pages/Registration";
import Reports from "./pages/Reports";
import UserManagement from "./pages/UserManagement";
import AddUserPage from "./pages/AddUserPage";
import ImportLead from "./pages/ImportLeads";
import AddLead from "./pages/AddLead";
import Expense from "./pages/Expense";
import LeadFunnelDashboard from "./pages/LeadFunnel";
import MissedLeads from "./pages/MissedLeads";
import Installation from "./pages/Installation";
import BankLoanApply from "./pages/BankLoanApply";
import DocumentSubmission from "./pages/DocumentSubmission";
import Disbursement from "./pages/Disbursement";
import LeadOverview from "./pages/LeadOverview";
import BankAtPending from "./pages/BankAtPending";
import Attandance from "./pages/Attandance";
import VisitDetails from "./pages/AddVisit";
import TeamTracking from "./pages/TeamTracking";
import MemberVisitHistory from "./pages/Membervisithistory";
import TeamAttendance from "./pages/TeamAttendance";

const theme = createTheme({
  palette: {
    primary: { main: "#3566bb", light: "#2172c9", dark: "#0a479b", contrastText: "#fff" },
    secondary: { main: "#1a237e", light: "#534bae", dark: "#000051", contrastText: "#fff" },
    background: { default: "#f8f9fa", paper: "#ffffff" },
    error: { main: "#f44336" },
    warning: { main: "#ff9800" },
    info: { main: "#2196f3" },
    success: { main: "#4caf50" },
    text: { primary: "#1a1a1a", secondary: "#666666", disabled: "#999999" },
    divider: "#e0e0e0",
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, fontSize: "2.5rem" },
    h2: { fontWeight: 700, fontSize: "2rem" },
    h3: { fontWeight: 600, fontSize: "1.75rem" },
    h4: { fontWeight: 600, fontSize: "1.5rem" },
    h5: { fontWeight: 600, fontSize: "1.25rem" },
    h6: { fontWeight: 600, fontSize: "1rem" },
    body1: { fontSize: "1rem", lineHeight: 1.5 },
    body2: { fontSize: "0.875rem", lineHeight: 1.43 },
    button: { fontWeight: 600, textTransform: "none" },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none", borderRadius: 12, fontWeight: 600, boxShadow: "none",
          "&:hover": { boxShadow: "0 4px 12px rgba(255,140,0,0.3)" },
        },
        containedPrimary: {
          background: "linear-gradient(45deg, #ff8c00 30%, #ff6b00 90%)",
          "&:hover": { background: "linear-gradient(45deg, #ff6b00 30%, #ff5500 90%)" },
        },
      },
    },
    MuiCard: {
      styleOverrides: { root: { borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", overflow: "visible" } },
    },
    MuiDrawer: {
      styleOverrides: { paper: { borderRadius: "0 20px 20px 0", borderRight: "none", boxShadow: "4px 0 20px rgba(0,0,0,0.1)" } },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <DashboardProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Routes>
                        <Route path="dashboard" element={<ProtectedRoute allowedRoles={["Head_office","ZSM","ASM","TEAM"]}><Dashboard /></ProtectedRoute>} />
                        <Route path="total-visits" element={<ProtectedRoute allowedRoles={["Head_office","ZSM","ASM","TEAM"]}><TotalVisitsPage /></ProtectedRoute>} />
                        <Route path="registration" element={<ProtectedRoute allowedRoles={["Head_office","ZSM","ASM","TEAM"]}><Registration /></ProtectedRoute>} />
                        <Route path="reports" element={<ProtectedRoute allowedRoles={["Head_office","ZSM","ASM","TEAM"]}><Reports /></ProtectedRoute>} />
                        <Route path="user-management" element={<ProtectedRoute allowedRoles={["Head_office","ZSM","ASM","TEAM"]}><UserManagement /></ProtectedRoute>} />
                        <Route path="add-user" element={<ProtectedRoute allowedRoles={["Head_office","ZSM","ASM"]}><AddUserPage /></ProtectedRoute>} />
                        <Route path="import-leads" element={<ProtectedRoute allowedRoles={["Head_office","ZSM","ASM","TEAM"]}><ImportLead /></ProtectedRoute>} />
                        <Route path="add-lead" element={<ProtectedRoute allowedRoles={["Head_office","ZSM","ASM","TEAM"]}><AddLead /></ProtectedRoute>} />
                        <Route path="expense" element={<ProtectedRoute allowedRoles={["Head_office","ZSM","ASM","TEAM"]}><Expense /></ProtectedRoute>} />
                        <Route path="lead-funnel" element={<ProtectedRoute allowedRoles={["Head_office","ZSM","ASM","TEAM"]}><LeadFunnelDashboard /></ProtectedRoute>} />
                        <Route path="missed-leads" element={<ProtectedRoute allowedRoles={["Head_office","ZSM","ASM","TEAM"]}><MissedLeads /></ProtectedRoute>} />
                        <Route path="installation-completion" element={<ProtectedRoute allowedRoles={["Head_office","ZSM","ASM","TEAM"]}><Installation /></ProtectedRoute>} />
                        <Route path="bank-loan-apply" element={<ProtectedRoute allowedRoles={["Head_office","ZSM","ASM","TEAM"]}><BankLoanApply /></ProtectedRoute>} />
                        <Route path="document-submission" element={<ProtectedRoute allowedRoles={["Head_office","ZSM","ASM","TEAM"]}><DocumentSubmission /></ProtectedRoute>} />
                        <Route path="add-visit" element={<ProtectedRoute allowedRoles={["Head_office","ZSM","ASM","TEAM"]}><VisitDetails /></ProtectedRoute>} />
                        <Route path="bank-at-pending" element={<ProtectedRoute allowedRoles={["Head_office","ZSM","ASM","TEAM"]}><BankAtPending /></ProtectedRoute>} />
                        <Route path="disbursement" element={<ProtectedRoute allowedRoles={["Head_office","ZSM","ASM","TEAM"]}><Disbursement /></ProtectedRoute>} />

                        {/* ── ATTENDANCE ───────────────────────────────────────────────────
                            /attendance              → own attendance (any role)
                            /attendance/:userId      → view a team member's attendance (managers only)
                                                       Attandance.jsx reads useParams().userId
                            /team-attendance         → team member picker (managers only)
                        ──────────────────────────────────────────────────────────────────── */}
                        <Route
                          path="attendance"
                          element={
                            <ProtectedRoute allowedRoles={["Head_office","ZSM","ASM","TEAM"]}>
                              <Attandance />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="attendance/:userId"
                          element={
                            <ProtectedRoute allowedRoles={["Head_office","ZSM","ASM"]}>
                              <Attandance />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="team-attendance"
                          element={
                            <ProtectedRoute allowedRoles={["Head_office","ZSM","ASM"]}>
                              <TeamAttendance />
                            </ProtectedRoute>
                          }
                        />

                        <Route path="team-tracking" element={<ProtectedRoute allowedRoles={["Head_office","ZSM","ASM","TEAM"]}><TeamTracking /></ProtectedRoute>} />
                        <Route path="member-history" element={<ProtectedRoute allowedRoles={["Head_office","ZSM","ASM","TEAM"]}><MemberVisitHistory /></ProtectedRoute>} />
                        <Route path="all-leads" element={<ProtectedRoute allowedRoles={["Head_office","ZSM","ASM","TEAM"]}><LeadOverview /></ProtectedRoute>} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                      </Routes>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
        </DashboardProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
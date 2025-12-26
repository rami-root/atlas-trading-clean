import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminUsers from "@/pages/admin/Users";
import AdminDeposits from "@/pages/admin/Deposits";
import AdminWithdrawals from "@/pages/admin/Withdrawals";
import AdminTradingControl from "@/pages/admin/TradingControl";
import AdminLogs from "@/pages/admin/Logs";
import AdminViolationsReport from "@/pages/admin/ViolationsReport";
import UserManagement from "@/pages/UserManagement";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import Trading from "./pages/Trading";
import TradingDetail from "./pages/TradingDetail";
import Wallet from "./pages/Wallet";
import Account from "./pages/Account";
import Team from "./pages/Team";
import Investments from "./pages/Investments";
import InvestmentDetail from "./pages/InvestmentDetail";
import Contracts from "./pages/Contracts";
import MyInvestments from "./pages/MyInvestments";
import Settings from "./pages/Settings";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import Login from "./pages/Login";
import Register from "./pages/Register";

function Router() {
  return (
    <Switch>
      <Route path={"/login"} component={Login} />
      <Route path={"/register"} component={Register} />
      <Route path={"/"} component={Home} />
      <Route path={"/trading"} component={Trading} />
      <Route path={"/trading-detail"} component={TradingDetail} />
      <Route path={"/wallet"} component={Wallet} />
      <Route path={"/invest"} component={Investments} />
      <Route path={"/invest/:id"} component={InvestmentDetail} />
      <Route path={"/team"} component={Team} />
      <Route path={"/account"} component={Account} />
      <Route path={"/contracts"} component={Contracts} />
      <Route path={"/my-investments"} component={MyInvestments} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/deposit"} component={Deposit} />
      <Route path={"/withdraw"} component={Withdraw} />
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/admin/users"} component={AdminUsers} />
      <Route path={"/admin/deposits"} component={AdminDeposits} />
      <Route path={"/admin/withdrawals"} component={AdminWithdrawals} />
      <Route path="/admin/logs" component={AdminLogs} />
      <Route path="/admin/trading-control" component={AdminTradingControl} />
      <Route path="/admin/violations" component={AdminViolationsReport} />
      <Route path="/admin/user-management" component={UserManagement} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

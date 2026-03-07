import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Payment from "./pages/Payment";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Product from "./pages/Product";
import Pricing from "./pages/Pricing";
import Documents from "./pages/Documents";
import UseCases from "./pages/UseCases";
import Purchases from "./pages/Purchases";
import Admin from "./pages/Admin";
import Feedback from "./pages/Feedback";
import { CartProvider } from "./contexts/CartContext";
import { CartSheet } from "./components/CartSheet";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { paypalConfig } from "./config/paypal";

import { SubscriptionProvider } from "./contexts/SubscriptionContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SubscriptionProvider>
        <CartProvider>
          <PayPalScriptProvider
            options={{
              clientId: paypalConfig.clientId,
              currency: paypalConfig.currency,
              intent: paypalConfig.intent,
              components: "buttons",
              dataSdkIntegrationSource: "integration",
            }}
          >
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <CartSheet />
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/purchases"
                  element={
                    <ProtectedRoute>
                      <Purchases />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/"
                  element={
                    <Index />
                  }
                />
                <Route path="/payment" element={<Payment />} />
                <Route path="/product" element={<Product />} />
                {/* <Route path="/pricing" element={<Pricing />} /> */}
                {/* <Route path="/documents" element={<Documents />} /> */}
                <Route path="/use-cases" element={<UseCases />} />
                <Route path="/feedback" element={<Feedback />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <Admin />
                    </ProtectedRoute>
                  }
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
          </PayPalScriptProvider>
        </CartProvider>
      </SubscriptionProvider>
    </AuthProvider>
  </QueryClientProvider>
);


export default App;

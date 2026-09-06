import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import GamingPcRouter from "./pages/GamingPcRouter";
import PCBuilder from "./pages/PCBuilder";
import Checkout from "./pages/Checkout";
import ThankYou from "./pages/ThankYou";
import Wishlist from "./pages/Wishlist";
import AdminLogin from "./pages/AdminLogin";
import AdminSignup from "./pages/AdminSignup";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProducts from "./pages/AdminProducts";
import AdminVendors from "./pages/AdminVendors";
import AdminCategories from "./pages/AdminCategories";
import AdminCustomization from "./pages/AdminCustomization";
import AdminOrders from "./pages/AdminOrders";
import AdminOrderDetail from "./pages/AdminOrderDetail";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminSettings from "./pages/AdminSettings";
import AdminFeaturedProducts from "./pages/AdminFeaturedProducts";
import AdminBilling from "./pages/AdminBilling";
import AdminFilterRules from "./pages/AdminFilterRules";
import AdminPCBuilderCategories from "./pages/AdminPCBuilderCategories";
import AdminBuilderRules from "./pages/AdminBuilderRules";
import AdminStoreLocations from "./pages/AdminStoreLocations";
import AdminHomepageSections from "./pages/AdminHomepageSections";
import AdminFeaturedGamingPcs from "./pages/AdminFeaturedGamingPcs";
import AdminPcSeries from "./pages/AdminPcSeries";
import AdminPcSeriesWorkbench from "./pages/AdminPcSeriesWorkbench";
import AdminBlogs from "./pages/AdminBlogs";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import AdminNews from "./pages/AdminNews";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import AdminTeam from "./pages/AdminTeam";
import OurTeam from "./pages/OurTeam";
import Contact from "./pages/Contact";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import Warranty from "./pages/Warranty";
import Returns from "./pages/Returns";
import AdminContactMessages from "./pages/AdminContactMessages";
import NotFound from "./pages/NotFound";
import { WhatsAppWidget } from "@/components/layout/WhatsAppWidget";

const queryClient = new QueryClient();

const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, search]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <WhatsAppWidget />
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/products" element={<Products />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/product/:id/:slug" element={<ProductDetail />} />
              <Route path="/gaming-pc/:id" element={<GamingPcRouter />} />
              <Route path="/pc-builder" element={<PCBuilder />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogDetail />} />
              <Route path="/news" element={<News />} />
              <Route path="/news/:slug" element={<NewsDetail />} />
              <Route path="/our-team" element={<OurTeam />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/thank-you" element={<ThankYou />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/about" element={<About />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/warranty" element={<Warranty />} />
              <Route path="/returns" element={<Returns />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/signup" element={<AdminSignup />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/products/:id" element={<AdminProducts />} />
              <Route path="/admin/vendors" element={<AdminVendors />} />
              <Route path="/admin/vendors/:id" element={<AdminVendors />} />
              <Route path="/admin/categories" element={<AdminCategories />} />
              <Route path="/admin/categories/:id" element={<AdminCategories />} />
              <Route path="/admin/customization" element={<AdminCustomization />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />
              <Route path="/admin/featured-products" element={<AdminFeaturedProducts />} />
              <Route path="/admin/filter-rules" element={<AdminFilterRules />} />
              <Route path="/admin/filter-rules/:id" element={<AdminFilterRules />} />
              <Route path="/admin/pc-builder-categories" element={<AdminPCBuilderCategories />} />
              <Route path="/admin/builder-rules" element={<AdminBuilderRules />} />
              <Route path="/admin/billing" element={<AdminBilling />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/store-locations" element={<AdminStoreLocations />} />
              <Route path="/admin/store-locations/:id" element={<AdminStoreLocations />} />
              <Route path="/admin/homepage-sections" element={<AdminHomepageSections />} />
              <Route path="/admin/featured-gaming-pcs" element={<AdminFeaturedGamingPcs />} />
              <Route path="/admin/pc-series" element={<AdminPcSeries />} />
              <Route path="/admin/pc-series/:seriesId" element={<AdminPcSeriesWorkbench />} />
              <Route path="/admin/blogs" element={<AdminBlogs />} />
              <Route path="/admin/blogs/:id" element={<AdminBlogs />} />
              <Route path="/admin/news" element={<AdminNews />} />
              <Route path="/admin/news/:id" element={<AdminNews />} />
              <Route path="/admin/team" element={<AdminTeam />} />
              <Route path="/admin/contact-messages" element={<AdminContactMessages />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

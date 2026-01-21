import { useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";
import { CyberButton } from "@/components/ui/CyberButton";
import { GlitchText } from "@/components/ui/GlitchText";

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 cyber-grid opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial-purple opacity-20 blur-3xl" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center relative z-10 px-4"
      >
        <GlitchText as="h1" className="text-8xl md:text-9xl font-bold text-primary mb-4">
          404
        </GlitchText>
        <h2 className="font-orbitron text-2xl md:text-3xl font-bold text-foreground mb-4">
          SYSTEM ERROR
        </h2>
        <p className="text-muted-foreground mb-8 font-mono-tech">
          The page "{location.pathname}" could not be found
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/">
            <CyberButton size="lg">
              <Home className="w-5 h-5 mr-2" />
              GO HOME
            </CyberButton>
          </Link>
          <Link to="/products">
            <CyberButton variant="outline" size="lg" glowColor="purple">
              <ArrowLeft className="w-5 h-5 mr-2" />
              PRODUCTS
            </CyberButton>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;

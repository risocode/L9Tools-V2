
"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLoading } from "@/context/loading-context";
import { useAuth } from "@/context/auth-context";
import PageLoader from "@/components/ui/page-loader";

export default function PageLoaderWrapper() {
  const { isLoading: isPageLoading } = useLoading();
  const { isAuthenticating, isInitialLoading } = useAuth();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const isLoading = isPageLoading || isAuthenticating || isInitialLoading;

  if (!hasMounted) {
    return null;
  }

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="page-loader-overlay"
        >
          <PageLoader />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

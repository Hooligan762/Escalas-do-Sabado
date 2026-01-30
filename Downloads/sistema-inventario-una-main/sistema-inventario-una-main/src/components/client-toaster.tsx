"use client";

import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";

export function ClientToaster() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <div suppressHydrationWarning><Toaster /></div>;
}

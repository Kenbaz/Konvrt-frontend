'use client';

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createQueryClient } from "@/lib/api/queryClient";


interface QueryProviderProps { 
    children: React.ReactNode;
};


export function QueryProvider({ children }: QueryProviderProps) {
    // Initialize QueryClient only once
    const [queryClient] = useState(() => createQueryClient());

    return (
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-right"
        />
      </QueryClientProvider>
    );
};
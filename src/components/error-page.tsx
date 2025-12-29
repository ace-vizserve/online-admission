import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { AlertTriangle, Home, RefreshCcw } from "lucide-react";
import { Link } from "react-router";

interface ErrorPageProps {
  error?: Error;
  resetErrorBoundary?: () => void;
}

export default function ErrorPage({ error, resetErrorBoundary }: ErrorPageProps) {
  return (
    <div className="min-h-screen rounded-xl w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 px-6">
      <div className="max-w-2xl w-full text-center space-y-8">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="relative inline-flex items-center justify-center">
          <div className="absolute inset-0 bg-red-100 rounded-full blur-2xl animate-pulse" />
          <div className="relative h-20 w-20 bg-white rounded-2xl shadow-xl border border-red-50 flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-red-500" strokeWidth={1.5} />
          </div>
        </motion.div>

        <div className="space-y-3">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-5xl">Oops! Something went wrong.</h1>
          <p className="text-lg text-slate-500 max-w-md mx-auto">
            We encountered an unexpected error while processing your request. Don't worry, your data is safe.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            onClick={() => resetErrorBoundary?.() || window.location.reload()}
            size="lg"
            className="w-full sm:w-auto px-8 py-6 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-blue-900/10 gap-2 text-base font-bold">
            <RefreshCcw className="w-4 h-4" />
            Try Again
          </Button>

          <Button
            variant="outline"
            size="lg"
            asChild
            className="w-full sm:w-auto px-8 py-6 rounded-xl gap-2 text-base font-bold border-slate-200">
            <Link to="/">
              <Home className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Technical Details (Optional/Collapsible) */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="pt-8">
            <Card className="bg-slate-50/50 border-slate-100 p-4 text-left">
              <details className="group cursor-pointer">
                <summary className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                  Technical Details
                  <span className="group-open:rotate-180 transition-transform">↓</span>
                </summary>
                <div className="mt-3 p-3 bg-white rounded border border-slate-100 font-mono text-[10px] text-red-600 overflow-x-auto">
                  {error.message || "Unknown error occurred"}
                  <br />
                  <span className="text-slate-400 mt-1 block">Reference: {new Date().getTime()}</span>
                </div>
              </details>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

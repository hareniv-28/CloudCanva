"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle, XCircle, Shield } from "lucide-react";
import api from "@/lib/api";

interface QuotaWarning {
  level: string;
  message: string;
}

interface LiveResult {
  resource: string;
  current: number;
  adding: number;
  total_after: number;
  limit: number;
  status: string;
  message: string;
}

interface QuotaCheckProps {
  getConfig: () => any;
}

export function QuotaCheck({ getConfig }: QuotaCheckProps) {
  const [warnings, setWarnings] = useState<QuotaWarning[]>([]);
  const [liveResults, setLiveResults] = useState<LiveResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCredDialog, setShowCredDialog] = useState(false);
  const [accessKey, setAccessKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [region, setRegion] = useState("eu-north-1");
  const [liveLoading, setLiveLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  async function handleStaticCheck() {
    setLoading(true);
    try {
      const config = getConfig();
      const res = await api.post("/check-quotas", config);
      setWarnings(res.data.warnings || []);
      setChecked(true);
    } catch (err) {
      console.error("Quota check failed:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLiveCheck() {
    setLiveLoading(true);
    try {
      const config = getConfig();
      const res = await api.post("/check-quotas-live", {
        ...config,
        credentials: {
          access_key_id: accessKey,
          secret_access_key: secretKey,
        },
        region,
      });
      setLiveResults(res.data.results || []);
      setShowCredDialog(false);
      setAccessKey("");
      setSecretKey("");
    } catch (err: any) {
      console.error("Live check failed:", err);
    } finally {
      setLiveLoading(false);
    }
  }

  const getIcon = (level: string) => {
    switch (level) {
      case "error":
        return <XCircle size={14} className="text-red-500" />;
      case "warning":
        return <AlertTriangle size={14} className="text-yellow-500" />;
      default:
        return <CheckCircle size={14} className="text-green-500" />;
    }
  };

  return (
    <div className="mt-4 p-3 rounded-lg border border-slate-600 bg-[#0f172a]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold flex items-center gap-1.5 text-sky-400">
          <Shield size={14} />
          Quota Check
        </h3>
        <Button size="sm" variant="outline" onClick={handleStaticCheck} disabled={loading} className="bg-slate-700 text-white border-slate-500 hover:bg-slate-600 text-xs h-7">
          {loading ? "Checking..." : "Check Limits"}
        </Button>
      </div>

      {/* Static warnings */}
      {checked && warnings.length > 0 && (
        <div className="space-y-1.5">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-xs p-2 rounded bg-muted/50">
              {getIcon(w.level)}
              <span>{w.message}</span>
            </div>
          ))}
        </div>
      )}

      {checked && warnings.length === 0 && (
        <p className="text-xs text-green-500">No quota issues detected.</p>
      )}

      {/* Live check option */}
      {checked && (
        <div className="border border-slate-600 rounded-md p-2.5 bg-slate-800/50 space-y-2 mt-2">
          <p className="text-xs text-slate-400">
            Verify against your actual AWS account?
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowCredDialog(true)}
            className="bg-slate-700 text-white border-slate-500 hover:bg-slate-600 text-xs h-7"
          >
            Check My Account
          </Button>
        </div>
      )}

      {/* Live results */}
      {liveResults.length > 0 && (
        <div className="space-y-1.5 border rounded p-3">
          <h4 className="text-xs font-semibold mb-2">Live Account Status ({region})</h4>
          {liveResults.map((r, i) => (
            <div key={i} className="flex items-start gap-2 text-xs p-2 rounded bg-muted/50">
              {getIcon(r.status)}
              <span>{r.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Credentials Dialog */}
      <Dialog open={showCredDialog} onOpenChange={setShowCredDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AWS Credentials for Quota Check</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              We'll use these credentials only to check your current resource usage (read-only). Credentials are not stored.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Access Key ID</label>
              <Input
                placeholder="AKIA..."
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Secret Access Key</label>
              <Input
                type="password"
                placeholder="Your secret key"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Region</label>
              <Input
                placeholder="eu-north-1"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCredDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleLiveCheck}
              disabled={liveLoading || !accessKey || !secretKey}
            >
              {liveLoading ? "Checking..." : "Verify Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

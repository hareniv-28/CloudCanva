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
import { Shield, Download, Copy, Check, CheckCircle, XCircle } from "lucide-react";
import api from "@/lib/api";

interface IAMPolicyGeneratorProps {
  getConfig: () => any;
}

export function IAMPolicyGenerator({ getConfig }: IAMPolicyGeneratorProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [showValidateDialog, setShowValidateDialog] = useState(false);
  const [policy, setPolicy] = useState<any>(null);
  const [summary, setSummary] = useState("");
  const [resourceTypes, setResourceTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Validator state
  const [accessKey, setAccessKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [validating, setValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<any>(null);

  async function handleGenerate() {
    setLoading(true);
    try {
      const config = getConfig();
      const res = await api.post("/generate-iam-policy", config);
      setPolicy(res.data.policy);
      setSummary(res.data.summary);
      setResourceTypes(res.data.resource_types);
      setShowDialog(true);
    } catch (err) {
      console.error("Failed to generate IAM policy:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleValidate() {
    setValidating(true);
    try {
      const config = getConfig();
      const res = await api.post("/validate-iam-permissions", {
        ...config,
        credentials: {
          access_key_id: accessKey,
          secret_access_key: secretKey,
        },
      });
      setValidationResults(res.data);
      setShowValidateDialog(false);
      setAccessKey("");
      setSecretKey("");
    } catch (err: any) {
      console.error("Validation failed:", err);
    } finally {
      setValidating(false);
    }
  }

  function handleDownload() {
    if (!policy) return;
    const blob = new Blob([JSON.stringify(policy, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cloudcanva-terraform-policy.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function handleCopy() {
    if (!policy) return;
    navigator.clipboard.writeText(JSON.stringify(policy, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <div className="mt-4 p-3 rounded-lg border border-slate-600 bg-[#0f172a]">
        <h3 className="text-sm font-bold flex items-center gap-1.5 text-sky-400 mb-2">
          <Shield size={14} />
          IAM Policy
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          Generate minimum permissions or validate your existing role.
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleGenerate} disabled={loading} className="bg-slate-700 text-white border-slate-500 hover:bg-slate-600 text-xs h-7">
            {loading ? "Generating..." : "Generate Policy"}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setShowValidateDialog(true)} className="bg-slate-700 text-white border-slate-500 hover:bg-slate-600 text-xs h-7">
            Validate Role
          </Button>
        </div>
      </div>

      {/* Validation results (shown inline after checking) */}
      {validationResults && (
        <div className="mt-3 space-y-2 border rounded p-3">
          <h4 className="text-xs font-semibold">
            Permission Check: {validationResults.summary.can_deploy ? (
              <span className="text-green-500">Can Deploy ✓</span>
            ) : (
              <span className="text-red-500">Will Fail ✗</span>
            )}
          </h4>
          <p className="text-xs text-muted-foreground">{validationResults.message}</p>
          {validationResults.denied_actions.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-red-500">Missing permissions:</p>
              {validationResults.denied_actions.map((action: string) => (
                <div key={action} className="flex items-center gap-1.5 text-xs">
                  <XCircle size={12} className="text-red-500" />
                  <span className="font-mono">{action}</span>
                </div>
              ))}
            </div>
          )}
          {validationResults.summary.can_deploy && (
            <div className="flex items-center gap-1.5 text-xs text-green-500">
              <CheckCircle size={12} />
              All {validationResults.summary.allowed} required permissions are available.
            </div>
          )}
        </div>
      )}

      {/* Generate Policy Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield size={18} />
              Least-Privilege IAM Policy
            </DialogTitle>
          </DialogHeader>

          {policy && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">{summary}</p>

              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Resource Types
                </p>
                <div className="flex flex-wrap gap-1">
                  {resourceTypes.map((type) => (
                    <span
                      key={type}
                      className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Policy JSON
                </p>
                <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-[300px] border">
                  {JSON.stringify(policy, null, 2)}
                </pre>
              </div>

              <div className="bg-muted/50 border rounded p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">How to use:</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>Download or copy the policy JSON</li>
                  <li>Go to AWS Console → IAM → Policies → Create Policy</li>
                  <li>Paste the JSON in the JSON editor</li>
                  <li>Name it "CloudCanva-Terraform-Policy"</li>
                  <li>Attach it to your IAM user/role used for Terraform</li>
                </ol>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCopy}>
              {copied ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button onClick={handleDownload}>
              <Download size={14} className="mr-1" />
              Download policy.json
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Validate Permissions Dialog */}
      <Dialog open={showValidateDialog} onOpenChange={setShowValidateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Validate IAM Permissions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Provide your AWS credentials to check if you have the required permissions to deploy this architecture. Credentials are not stored.
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowValidateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleValidate} disabled={validating || !accessKey || !secretKey}>
              {validating ? "Checking..." : "Validate Permissions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

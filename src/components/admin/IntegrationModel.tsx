import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import axios from "axios";

interface IntegrationModalProps {
  open: boolean;
  onClose: () => void;
  integration: any;
  refresh: () => void;
}

export function IntegrationModal({ open, onClose, integration, refresh }: IntegrationModalProps) {
  const [form, setForm] = useState({
    api_key: integration?.api_key || "",
    secret_key: integration?.secret_key || "",
    account_id: integration?.account_id || "",
    enabled: integration?.enabled || false,
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const save = async () => {
    try {
      setLoading(true);
      setMsg("");

      const token = localStorage.getItem("token");
      await axios.put(
        `https://e-book-backend-production.up.railway.app/api/admin/settings/integrations/${integration.id}`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMsg("Integration updated successfully!");
      refresh();

      setTimeout(() => onClose(), 1000);

    } catch (err) {
      console.error(err);
      setMsg("Failed to update integration.");
    } finally {
      setLoading(false);
    }
  };

  if (!integration) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#1d4d6a] text-lg">
            Configure {integration.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">

          {/* API Key */}
          <div>
            <Label>API Key</Label>
            <Input
              name="api_key"
              placeholder="Enter API key"
              value={form.api_key}
              onChange={handleChange}
            />
          </div>

          {/* Secret Key */}
          <div>
            <Label>Secret Key</Label>
            <Input
              name="secret_key"
              placeholder="Enter Secret key"
              value={form.secret_key}
              onChange={handleChange}
            />
          </div>

          {/* Account ID / Optional */}
          <div>
            <Label>Account ID</Label>
            <Input
              name="account_id"
              placeholder="Optional"
              value={form.account_id}
              onChange={handleChange}
            />
          </div>

          {/* Status */}
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
            <span className="text-sm text-gray-700">Enabled</span>
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
            />
          </div>

          {/* Message */}
          {msg && (
            <p className="text-center text-sm text-green-600">{msg}</p>
          )}

          {/* Action Button */}
          <Button
            className="w-full bg-[#bf2026] hover:bg-[#a01c22] text-white"
            disabled={loading}
            onClick={save}
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
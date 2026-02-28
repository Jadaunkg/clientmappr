import React, { useState } from 'react';
import { Button, FormLabel, Alert } from '../components/FormComponents';

export function SettingsPage() {
  const [settings, setSettings] = useState({
    defaultNoWebsiteOnly: true,
    emailNotifications: false,
    compactResults: false,
  });
  const [saved, setSaved] = useState(false);

  const onToggle = (field) => {
    setSaved(false);
    setSettings((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const onSubmit = (event) => {
    event.preventDefault();
    setSaved(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-600 mt-1">Configure default behavior for lead discovery and workspace UX.</p>
      </div>

      {saved && (
        <Alert type="success" message="Settings saved locally in this session." />
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
            <div>
              <FormLabel className="mb-0">Default to no-website leads</FormLabel>
              <p className="text-xs text-slate-500">Start discovery with verified leads that have no website.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.defaultNoWebsiteOnly}
              onChange={() => onToggle('defaultNoWebsiteOnly')}
              className="w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
            <div>
              <FormLabel className="mb-0">Email notifications</FormLabel>
              <p className="text-xs text-slate-500">Receive updates for completed discovery runs.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={() => onToggle('emailNotifications')}
              className="w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
            <div>
              <FormLabel className="mb-0">Compact results view</FormLabel>
              <p className="text-xs text-slate-500">Show more leads per viewport in list mode.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.compactResults}
              onChange={() => onToggle('compactResults')}
              className="w-4 h-4"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit">Save Settings</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SettingsPage;
import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button, Input, FormLabel, Alert } from '../components/FormComponents';

export function ProfilePage() {
  const { state } = useAuth();

  const user = state.user || {};
  const initialValues = useMemo(() => ({
    fullName: user.full_name || user.fullName || '',
    email: user.email || '',
    company: user.company_name || user.companyName || '',
    phone: user.phone || '',
  }), [user]);

  const [form, setForm] = useState(initialValues);
  const [saved, setSaved] = useState(false);

  const onChange = (field, value) => {
    setSaved(false);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = (event) => {
    event.preventDefault();
    setSaved(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Profile</h2>
        <p className="text-sm text-slate-600 mt-1">Manage your personal and business account details.</p>
      </div>

      {saved && (
        <Alert type="success" message="Profile changes saved locally in this session." />
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={onSubmit}>
          <div>
            <FormLabel htmlFor="fullName">Full Name</FormLabel>
            <Input
              id="fullName"
              value={form.fullName}
              onChange={(event) => onChange('fullName', event.target.value)}
              placeholder="Your name"
            />
          </div>

          <div>
            <FormLabel htmlFor="email">Email</FormLabel>
            <Input id="email" value={form.email} disabled />
          </div>

          <div>
            <FormLabel htmlFor="company">Company</FormLabel>
            <Input
              id="company"
              value={form.company}
              onChange={(event) => onChange('company', event.target.value)}
              placeholder="Your company"
            />
          </div>

          <div>
            <FormLabel htmlFor="phone">Phone</FormLabel>
            <Input
              id="phone"
              value={form.phone}
              onChange={(event) => onChange('phone', event.target.value)}
              placeholder="+1 555 123 4567"
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;
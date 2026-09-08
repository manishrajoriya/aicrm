'use client';

import { useState, useEffect } from 'react';
import { TeamMember, TeamRole } from '@/types/crm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Share2,
  Sparkles,
  CheckCircle2,
  Lock,
  ExternalLink,
  Trash2,
} from 'lucide-react';

interface MemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: TeamMember | null;
  onSave: (data: any) => Promise<any>;
  onDelete?: (id: string) => Promise<void>;
}

function generateSecurePassword(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
  let randomStr = '';
  for (let i = 0; i < 4; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `Staff@${randomStr}`;
}

export function MemberDialog({
  open,
  onOpenChange,
  member,
  onSave,
  onDelete,
}: MemberDialogProps) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // When a new member account is created, we hold the created credentials here to display the share card
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    password: string;
    phone: string;
    role: TeamRole;
    authCreated?: boolean;
    authMessage?: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Sales Executive' as TeamRole,
    status: 'active' as 'active' | 'inactive',
    password: '',
  });

  useEffect(() => {
    if (open) {
      setCreatedCredentials(null);
      setCopiedKey(null);
      setShowPassword(false);

      if (member) {
        setFormData({
          name: member.name || '',
          email: member.email || '',
          phone: member.phone || '',
          role: member.role || 'Sales Executive',
          status: member.status || 'active',
          password: '',
        });
      } else {
        setFormData({
          name: '',
          email: '',
          phone: '',
          role: 'Sales Executive',
          status: 'active',
          password: generateSecurePassword(),
        });
      }
    }
  }, [member, open]);

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // fallback
    }
  };

  const handleGenerateNewPassword = () => {
    setFormData((prev) => ({ ...prev, password: generateSecurePassword() }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Please fill in Member Name and Email.');
      return;
    }

    if (!member && (!formData.password || formData.password.length < 6)) {
      alert('Please provide a password of at least 6 characters for the staff login.');
      return;
    }

    try {
      setLoading(true);
      const res = await onSave(formData);

      // If adding a new member, display the credentials summary screen so owner can copy / WhatsApp
      if (!member) {
        setCreatedCredentials({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password.trim(),
          phone: formData.phone.trim(),
          role: formData.role,
          authCreated: res?.authCreated,
          authMessage: res?.authMessage,
        });
      } else {
        onOpenChange(false);
      }
    } catch (err: any) {
      alert('Failed to save team member: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!createdCredentials) return;
    const loginUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/login`
        : 'https://aischoolapp.in/login';

    const cleanPhone = createdCredentials.phone.replace(/[^0-9]/g, '');
    const message = `👋 *Hello ${createdCredentials.name}*,\n\nYour staff account for the *AI Admissions CRM* is now active!\n\n🔗 *Login Portal:* ${loginUrl}\n📧 *Email:* ${createdCredentials.email}\n🔑 *Password:* ${createdCredentials.password}\n💼 *Role:* ${createdCredentials.role}\n\nPlease log in to access your assigned school admissions leads and pipeline.`;

    const encoded = encodeURIComponent(message);
    const target = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;

    window.open(target, '_blank');
  };

  const handleCopyFullCredentials = () => {
    if (!createdCredentials) return;
    const loginUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/login`
        : 'https://aischoolapp.in/login';

    const message = `AI School CRM Login Credentials\n------------------------------\nPortal: ${loginUrl}\nStaff Member: ${createdCredentials.name}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\nRole: ${createdCredentials.role}`;

    handleCopy(message, 'all');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl bg-[#121215] border border-white/10 text-white p-6 shadow-2xl">
        {/* VIEW 1: CREATED CREDENTIALS SUCCESS SCREEN */}
        {createdCredentials ? (
          <div className="space-y-5 py-2">
            <DialogHeader className="space-y-2 text-left">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400 w-fit">
                <CheckCircle2 className="size-3.5" />
                <span>Login Account Created</span>
              </div>
              <DialogTitle className="text-white text-xl font-bold tracking-tight">
                Staff Credentials Ready
              </DialogTitle>
              <DialogDescription className="text-neutral-400 text-xs leading-relaxed">
                Full login account has been provisioned. Share these credentials with{' '}
                <span className="text-white font-medium">{createdCredentials.name}</span> so they can sign in immediately.
              </DialogDescription>
            </DialogHeader>

            {/* Credentials Card */}
            <div className="rounded-2xl border border-white/8 bg-[#18181c] p-4 space-y-3.5">
              {/* Portal URL */}
              <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                    Login Portal URL
                  </div>
                  <div className="text-xs text-white font-mono mt-0.5 truncate max-w-[220px]">
                    {typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login'}
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    handleCopy(
                      typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login',
                      'url'
                    )
                  }
                  className="h-8 px-2.5 text-xs rounded-lg border border-white/10 text-neutral-300 hover:text-white"
                >
                  {copiedKey === 'url' ? (
                    <Check className="size-3 text-emerald-400 mr-1" />
                  ) : (
                    <Copy className="size-3 mr-1" />
                  )}
                  {copiedKey === 'url' ? 'Copied' : 'Copy'}
                </Button>
              </div>

              {/* Email */}
              <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                    Login Email
                  </div>
                  <div className="text-xs text-white font-mono font-medium mt-0.5">
                    {createdCredentials.email}
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(createdCredentials.email, 'email')}
                  className="h-8 px-2.5 text-xs rounded-lg border border-white/10 text-neutral-300 hover:text-white"
                >
                  {copiedKey === 'email' ? (
                    <Check className="size-3 text-emerald-400 mr-1" />
                  ) : (
                    <Copy className="size-3 mr-1" />
                  )}
                  {copiedKey === 'email' ? 'Copied' : 'Copy'}
                </Button>
              </div>

              {/* Password */}
              <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                    Login Password
                  </div>
                  <div className="text-xs text-white font-mono font-bold mt-0.5 tracking-wider">
                    {showPassword ? createdCredentials.password : '••••••••••••'}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    className="size-8 p-0 rounded-lg border border-white/10 text-neutral-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(createdCredentials.password, 'password')}
                    className="h-8 px-2.5 text-xs rounded-lg border border-white/10 text-neutral-300 hover:text-white"
                  >
                    {copiedKey === 'password' ? (
                      <Check className="size-3 text-emerald-400 mr-1" />
                    ) : (
                      <Copy className="size-3 mr-1" />
                    )}
                    {copiedKey === 'password' ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>

              {/* Role */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <span className="text-neutral-400">Assigned Role:</span>
                <span className="font-semibold text-neutral-200">{createdCredentials.role}</span>
              </div>
            </div>

            {/* Quick Share Actions */}
            <div className="space-y-2 pt-1">
              <Button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full h-10 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-black font-semibold text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                <Share2 className="size-3.5" />
                Share Directly on WhatsApp
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyFullCredentials}
                  className="h-10 rounded-2xl border-white/10 bg-[#18181c] hover:bg-white/5 text-neutral-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5"
                >
                  {copiedKey === 'all' ? (
                    <Check className="size-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  {copiedKey === 'all' ? 'Copied All!' : 'Copy Full Details'}
                </Button>

                <Button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="h-10 rounded-2xl bg-white hover:bg-neutral-200 text-black font-semibold text-xs"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* VIEW 2: ADD / EDIT FORM */
          <>
            <DialogHeader>
              <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-semibold tracking-wider uppercase mb-0.5">
                <Sparkles className="size-3 text-neutral-300" />
                {member ? 'Staff Configuration' : 'Full Staff Account Setup'}
              </div>
              <DialogTitle className="text-white text-xl font-bold tracking-tight">
                {member ? 'Edit Staff Profile' : 'Add Team Member & Create Login'}
              </DialogTitle>
              <DialogDescription className="text-neutral-400 text-xs">
                {member
                  ? 'Update account designation or active availability.'
                  : 'Automatically generates a Supabase login account so the staff member can sign in right away.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-3.5 py-1">
              <div className="space-y-1.5">
                <Label htmlFor="mem_name" className="text-neutral-300 text-xs font-medium">
                  Full Name *
                </Label>
                <Input
                  id="mem_name"
                  placeholder="e.g. Aarav Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-[#18181c] border-white/8 text-xs text-white h-9 rounded-xl focus:border-white/20"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mem_email" className="text-neutral-300 text-xs font-medium">
                  Work Email (Login Username) *
                </Label>
                <Input
                  id="mem_email"
                  type="email"
                  placeholder="name@school.in"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-[#18181c] border-white/8 text-xs text-white h-9 rounded-xl focus:border-white/20"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mem_phone" className="text-neutral-300 text-xs font-medium">
                  Phone / WhatsApp Mobile
                </Label>
                <Input
                  id="mem_phone"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-[#18181c] border-white/8 text-xs text-white h-9 rounded-xl focus:border-white/20"
                />
              </div>

              {/* Staff Login Password Field (Only shown when adding new member) */}
              {!member && (
                <div className="space-y-1.5 p-3 rounded-2xl bg-[#18181c] border border-white/8">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="mem_password"
                      className="text-neutral-200 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Lock className="size-3 text-neutral-300" />
                      Login Account Password *
                    </Label>
                    <button
                      type="button"
                      onClick={handleGenerateNewPassword}
                      className="text-[11px] text-neutral-400 hover:text-white transition-colors underline cursor-pointer"
                    >
                      🎲 Re-generate
                    </button>
                  </div>

                  <div className="relative flex items-center">
                    <Input
                      id="mem_password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Minimum 6 characters"
                      className="bg-[#121215] border-white/10 text-xs font-mono text-white pr-16 h-9 rounded-xl focus:border-white/20"
                      required
                    />
                    <div className="absolute right-1 flex items-center gap-0.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowPassword(!showPassword)}
                        className="size-7 p-0 text-neutral-400 hover:text-white"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </Button>
                    </div>
                  </div>

                  <p className="text-[10px] text-neutral-400 leading-normal pt-0.5">
                    This staff member will use this email and password to sign into the CRM.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-0.5">
                <div className="space-y-1.5">
                  <Label htmlFor="mem_role" className="text-neutral-300 text-xs font-medium">
                    Designation
                  </Label>
                  <select
                    id="mem_role"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value as TeamRole })
                    }
                    className="w-full h-9 rounded-xl border border-white/8 bg-[#18181c] px-3 text-xs text-white outline-none cursor-pointer focus:border-white/20"
                  >
                    <option value="Sales Executive">Sales Executive</option>
                    <option value="Lead Specialist">Lead Specialist</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="mem_status" className="text-neutral-300 text-xs font-medium">
                    Status
                  </Label>
                  <select
                    id="mem_status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as 'active' | 'inactive',
                      })
                    }
                    className="w-full h-9 rounded-xl border border-white/8 bg-[#18181c] px-3 text-xs text-white outline-none cursor-pointer focus:border-white/20"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <DialogFooter className="pt-3 border-t border-white/5 bg-transparent mt-2 flex items-center justify-between gap-2 sm:justify-between">
                {member && !member.is_owner && onDelete ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={async () => {
                      if (confirm(`Are you sure you want to remove ${member.name} from the team? Any leads assigned to them will become unassigned.`)) {
                        try {
                          setLoading(true);
                          await onDelete(member.id);
                          onOpenChange(false);
                        } catch (err: any) {
                          alert('Failed to delete member: ' + (err.message || 'Unknown error'));
                        } finally {
                          setLoading(false);
                        }
                      }
                    }}
                    disabled={loading}
                    className="rounded-full text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs h-9 px-3 mr-auto border border-red-500/20"
                  >
                    <Trash2 className="size-3 mr-1.5" />
                    Delete Member
                  </Button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={loading}
                    className="rounded-full border-white/10 text-neutral-300 hover:text-white text-xs h-9 px-4"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="rounded-full bg-white text-black font-semibold hover:bg-neutral-200 px-5 shadow-sm text-xs h-9"
                  >
                    {loading
                      ? 'Creating Account...'
                      : member
                      ? 'Update Profile'
                      : 'Create Staff Account'}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Lead, TeamMember, LeadStatus, LeadPriority, LeadSource } from '@/types/crm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck,
  Users2,
  Building2,
  Phone,
  Sparkles,
} from 'lucide-react';

interface ImportLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamMembers: TeamMember[];
  onImportLeads: (leads: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'assigned_member'>[]) => Promise<void>;
}

interface ParsedLeadRow {
  organization: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  deal_value: number;
  notes?: string;
  isValid: boolean;
  validationError?: string;
}

export function ImportLeadsDialog({
  open,
  onOpenChange,
  teamMembers,
  onImportLeads,
}: ImportLeadsDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedLeadRow[]>([]);
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normalize column names
  const normalizeKey = (key: string): string => {
    return key.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  const parseFile = async (selectedFile: File) => {
    setErrorMsg('');
    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        setErrorMsg('The uploaded Excel file contains no worksheets.');
        return;
      }

      const sheet = workbook.Sheets[firstSheetName];
      const rawJsonRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (rawJsonRows.length === 0) {
        setErrorMsg('No data rows found in the sheet. Please check the Excel file.');
        return;
      }

      const parsed: ParsedLeadRow[] = [];

      for (const row of rawJsonRows) {
        const normalizedRow: Record<string, any> = {};
        Object.keys(row).forEach((k) => {
          normalizedRow[normalizeKey(k)] = String(row[k]).trim();
        });

        // Check if row has any non-empty cell
        const hasAnyContent = Object.values(normalizedRow).some((v) => String(v).trim().length > 0);
        if (!hasAnyContent) {
          continue;
        }

        // 1. Organization / School (Optional)
        let organization =
          normalizedRow['schoolname'] ||
          normalizedRow['school'] ||
          normalizedRow['organization'] ||
          normalizedRow['organizationname'] ||
          normalizedRow['institute'] ||
          normalizedRow['college'] ||
          normalizedRow['institution'] ||
          '';

        // 2. Contact Person (Optional)
        let name =
          normalizedRow['name'] ||
          normalizedRow['contactname'] ||
          normalizedRow['contactperson'] ||
          normalizedRow['contact'] ||
          normalizedRow['person'] ||
          normalizedRow['principal'] ||
          normalizedRow['director'] ||
          '';

        // 3. Phone Number (Optional)
        let phone =
          normalizedRow['phone'] ||
          normalizedRow['phonenumber'] ||
          normalizedRow['mobile'] ||
          normalizedRow['mobilenumber'] ||
          normalizedRow['contactno'] ||
          normalizedRow['whatsapp'] ||
          normalizedRow['cell'] ||
          '';
        phone = phone.replace(/[^0-9+]/g, '');

        // 4. Email (Optional)
        const email =
          normalizedRow['email'] ||
          normalizedRow['emailaddress'] ||
          normalizedRow['mail'] ||
          undefined;

        // 5. City (Optional)
        const city =
          normalizedRow['city'] ||
          normalizedRow['location'] ||
          normalizedRow['district'] ||
          normalizedRow['state'] ||
          normalizedRow['address'] ||
          undefined;

        // 6. Source (Optional - defaults to Website/Other)
        const rawSource = normalizedRow['source'] || normalizedRow['leadsource'] || '';
        const validSources: LeadSource[] = ['Website', 'Referral', 'Cold Call', 'Social Media', 'Event', 'WhatsApp', 'Other'];
        const matchedSource = validSources.find(
          (s) => s.toLowerCase() === rawSource.toLowerCase()
        ) || (rawSource ? 'Other' : 'Website');

        // 7. Status / Stage (Optional - defaults to New)
        const rawStatus = normalizedRow['status'] || normalizedRow['stage'] || '';
        const validStatuses: LeadStatus[] = ['New', 'Contacted', 'In Progress', 'Proposal Sent', 'Won', 'Lost'];
        const matchedStatus = validStatuses.find(
          (st) => st.toLowerCase() === rawStatus.toLowerCase()
        ) || 'New';

        // 8. Priority (Optional - defaults to Medium)
        const rawPriority = normalizedRow['priority'] || '';
        const validPriorities: LeadPriority[] = ['High', 'Medium', 'Low'];
        const matchedPriority = validPriorities.find(
          (p) => p.toLowerCase() === rawPriority.toLowerCase()
        ) || 'Medium';

        // 9. Deal Value (Optional - defaults to 0)
        const rawValue = normalizedRow['dealvalue'] || normalizedRow['budget'] || normalizedRow['value'] || normalizedRow['amount'] || '';
        const deal_value = Number(String(rawValue).replace(/[^0-9.]/g, '')) || 0;

        // 10. Notes (Optional)
        const notes =
          normalizedRow['notes'] ||
          normalizedRow['remarks'] ||
          normalizedRow['comment'] ||
          normalizedRow['comments'] ||
          undefined;

        // Flexible Validation:
        // A row is valid if it has ANY identifiable information (School name, Contact name, Phone, Email, or City)
        const hasIdentifiableInfo = Boolean(organization || name || phone || email || city || notes);

        // Graceful fallback for database constraints
        if (!organization) {
          organization = name
            ? `${name}'s School`
            : (city ? `School in ${city}` : (phone ? `School (${phone})` : 'New School Lead'));
        }

        if (!name) {
          name = organization ? `${organization} Contact` : 'Principal / Admin';
        }

        parsed.push({
          organization,
          name,
          phone,
          email,
          city,
          source: matchedSource,
          status: matchedStatus,
          priority: matchedPriority,
          deal_value,
          notes,
          isValid: hasIdentifiableInfo,
          validationError: hasIdentifiableInfo ? undefined : 'Blank row',
        });
      }

      if (parsed.length === 0) {
        setErrorMsg('All rows in the uploaded file were blank.');
        return;
      }

      setFile(selectedFile);
      setParsedRows(parsed);
    } catch (err: any) {
      console.error('Error parsing excel file:', err);
      setErrorMsg('Failed to parse Excel file: ' + (err.message || 'Invalid format'));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      parseFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      parseFile(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'School Name': 'Delhi Public School',
        'Contact Person': 'Dr. Rajesh Sharma',
        'Phone Number': '9876543210',
        'Email Address': 'principal@dps-sample.edu.in',
        'City': 'New Delhi',
        'Deal Value': 150000,
        'Stage': 'New',
        'Notes': 'Interested in ERP and attendance system',
      },
      {
        'School Name': 'St. Xavier High School',
        'Contact Person': '',
        'Phone Number': '9123456780',
        'Email Address': '',
        'City': 'Mumbai',
        'Deal Value': '',
        'Stage': '',
        'Notes': 'Only school and phone provided',
      },
      {
        'School Name': 'Modern Academy',
        'Contact Person': 'Sunil Gupta',
        'Phone Number': '',
        'Email Address': 'sunil@modern.edu',
        'City': 'Jaipur',
        'Deal Value': '',
        'Stage': '',
        'Notes': '',
      },
      {
        'School Name': 'Vidya Bharati High School',
        'Contact Person': '',
        'Phone Number': '',
        'Email Address': '',
        'City': 'Pune',
        'Deal Value': '',
        'Stage': '',
        'Notes': 'Only school name and city provided',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads Template');

    // Auto-fit column widths
    worksheet['!cols'] = [
      { wch: 32 }, // School Name
      { wch: 22 }, // Contact Person
      { wch: 16 }, // Phone Number
      { wch: 30 }, // Email Address
      { wch: 16 }, // City
      { wch: 14 }, // Deal Value
      { wch: 14 }, // Stage
      { wch: 45 }, // Notes
    ];

    XLSX.writeFile(workbook, 'School_Leads_Import_Template.xlsx');
  };

  const validRows = parsedRows.filter((r) => r.isValid);

  const handleImportSubmit = async () => {
    if (validRows.length === 0) {
      alert('No valid leads to import. Please check that your Excel file contains lead rows.');
      return;
    }

    try {
      setLoading(true);
      const leadsPayload = validRows.map((r) => ({
        organization: r.organization,
        name: r.name,
        phone: r.phone || '-',
        email: r.email || null,
        city: r.city || null,
        source: r.source,
        status: r.status,
        priority: r.priority,
        deal_value: r.deal_value || 0,
        notes: r.notes || null,
        assigned_to: assigneeId ? assigneeId : null,
      }));

      await onImportLeads(leadsPayload);
      onOpenChange(false);
      // Reset state
      setFile(null);
      setParsedRows([]);
      setAssigneeId('');
    } catch (err: any) {
      alert('Failed to import leads: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
          setFile(null);
          setParsedRows([]);
          setErrorMsg('');
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-[#121215] border border-white/10 text-white p-0 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/8 bg-[#16161a] flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                Import Multiple Leads from Excel
              </DialogTitle>
              <DialogDescription className="text-neutral-400 text-xs mt-0.5">
                Upload your school leads spreadsheet (.xlsx, .xls, .csv). Most fields are optional.
              </DialogDescription>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadTemplate}
            className="rounded-full border-white/10 bg-[#1e1e24] hover:bg-[#25252d] text-neutral-300 hover:text-white text-xs gap-1.5 shrink-0"
            title="Download sample Excel sheet with pre-made columns"
          >
            <Download className="size-3.5 text-indigo-400" />
            <span>Sample Excel</span>
          </Button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Flexible Format Tip */}
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs leading-relaxed">
            <Sparkles className="size-4 shrink-0 text-emerald-400 mt-0.5" />
            <div>
              <span className="font-semibold text-emerald-200">Flexible import: </span>
              Most fields (Contact Person, Phone, Email, City, Stage, Deal Value, Notes) are completely optional! Even if you only have school names or a simple list, leads will be imported smoothly.
            </div>
          </div>

          {/* File Upload Zone */}
          {!file ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                dragActive
                  ? 'border-emerald-400 bg-emerald-500/10'
                  : 'border-white/15 bg-[#16161a] hover:border-white/30 hover:bg-[#1a1a20]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300">
                <UploadCloud className="size-6 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">
                  Click to browse or drag & drop Excel file
                </h4>
                <p className="text-xs text-neutral-400">
                  Supports Excel (.xlsx, .xls) and CSV (.csv) • No rigid columns required
                </p>
              </div>
            </div>
          ) : (
            /* Uploaded File Info Card */
            <div className="p-4 rounded-2xl bg-[#16161a] border border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-9 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <FileCheck className="size-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{file.name}</div>
                  <div className="text-[11px] text-neutral-400">
                    {(file.size / 1024).toFixed(1)} KB • {parsedRows.length} rows detected ({validRows.length} valid)
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setParsedRows([]);
                }}
                className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                title="Remove file"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Configuration: Optional Assignee */}
          {parsedRows.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#16161a] border border-white/8 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <Label htmlFor="bulk-assignee" className="text-xs font-semibold text-white">
                    Bulk Assign Representatives (Optional)
                  </Label>
                  <p className="text-[11px] text-neutral-400">
                    Assign all imported school leads to a specific team member, or leave unassigned.
                  </p>
                </div>
                <select
                  id="bulk-assignee"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="h-9 rounded-xl border border-white/10 bg-[#1c1c22] px-3 text-xs text-white outline-none cursor-pointer sm:w-56"
                >
                  <option value="">Leave Unassigned</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">
                  Preview Leads ({Math.min(parsedRows.length, 10)} of {parsedRows.length} rows)
                </span>
                <span className="text-neutral-400 text-[11px]">
                  {validRows.length} {validRows.length === 1 ? 'lead' : 'leads'} ready to import
                  {parsedRows.length > validRows.length && (
                    <span className="text-amber-400 ml-1">
                      • {parsedRows.length - validRows.length} blank rows skipped
                    </span>
                  )}
                </span>
              </div>

              <div className="border border-white/8 rounded-2xl overflow-hidden bg-[#16161a]">
                <div className="overflow-x-auto max-h-56">
                  <table className="w-full text-left text-xs text-neutral-300">
                    <thead className="bg-[#1e1e24] text-neutral-400 text-[11px] uppercase tracking-wider sticky top-0 border-b border-white/5">
                      <tr>
                        <th className="py-2.5 px-3">School Name</th>
                        <th className="py-2.5 px-3">Contact</th>
                        <th className="py-2.5 px-3">Phone</th>
                        <th className="py-2.5 px-3">City</th>
                        <th className="py-2.5 px-3">Stage</th>
                        <th className="py-2.5 px-3 text-right">Value (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {parsedRows.slice(0, 10).map((row, idx) => (
                        <tr
                          key={idx}
                          className={row.isValid ? 'hover:bg-white/5' : 'bg-red-500/5 text-red-300'}
                        >
                          <td className="py-2 px-3 font-medium text-white truncate max-w-[160px]">
                            {row.organization}
                          </td>
                          <td className="py-2 px-3 truncate max-w-[120px]">{row.name}</td>
                          <td className="py-2 px-3 font-mono text-[11px]">{row.phone || '—'}</td>
                          <td className="py-2 px-3">{row.city || '—'}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px]">
                              {row.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-white">
                            ₹{row.deal_value.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/8 bg-[#16161a] flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="rounded-full border-white/10 text-neutral-400 hover:text-white text-xs"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={loading || validRows.length === 0}
            onClick={handleImportSubmit}
            className="rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs px-5 shadow-sm"
          >
            {loading
              ? 'Importing...'
              : `Import ${validRows.length} ${validRows.length === 1 ? 'Lead' : 'Leads'}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

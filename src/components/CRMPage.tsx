import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Filter, Download, MoreVertical, Mail, Phone, Tag, Edit3, Trash2, Eye, UserPlus, Upload, DollarSign, TrendingUp, Calendar, Clock, MessageSquare, FileText, Bell, CheckCircle, X, Star, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/authStore';
import { contactsAPI, businessAPI } from '../lib/api';

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  tags: string[];
  stage: string;
  stageId?: string;
  dealValue: number;
  lastActivity: string;
  avatar: string;
  createdAt: string;
  pipelineId?: string;
  notes?: Note[];
  activities?: Activity[];
  tasks?: Task[];
  leadScore?: 'hot' | 'warm' | 'cold';
}

interface Note {
  id: string;
  content: string;
  createdAt: string;
  type: 'note' | 'call' | 'email' | 'meeting';
}

interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'whatsapp';
  title: string;
  description?: string;
  date: string;
  duration?: string;
}

interface Task {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface Pipeline {
  id: string;
  name: string;
  stages: { id: string; name: string; order: number; color?: string }[];
  isDefault?: boolean;
}

interface Deal {
  id: string;
  contactId: string;
  contactName: string;
  title: string;
  value: number;
  stage: string;
  probability: number;
  expectedClose: string;
  createdAt: string;
}

interface Invoice {
  id: string;
  number: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  date: string;
  dueDate: string;
  paidDate?: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface LedgerEntry {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  paymentMethod?: 'cash' | 'bank' | 'upi' | 'card';
  invoiceId?: string;
  contactName?: string;
}

interface Appointment {
  id: string;
  title: string;
  clientName: string;
  clientPhone: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  reminder: boolean;
}

const STAGES = ['New Lead', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'];
const STAGE_COLORS: Record<string, string> = {
  'New Lead': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Contacted': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Qualified': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Proposal': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Won': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Lost': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function CRMPage() {
  const navigate = useNavigate();
  const { business, isDemoMode } = useAuthStore();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'contacts' | 'deals' | 'invoices' | 'ledger' | 'appointments'>('contacts');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  const demoContacts: Contact[] = [
    { id: '1', name: 'Rahul Sharma', phone: '+91 98765 43210', email: 'rahul@example.com', company: 'Tech Solutions Pvt Ltd', tags: ['Hot Lead', 'VIP'], stage: 'Qualified', dealValue: 85000, lastActivity: '2 hours ago', avatar: 'RS', createdAt: '1/10/2024', leadScore: 'hot', notes: [{ id: '1', content: 'Interested in premium package', createdAt: '2024-01-15', type: 'note' }], activities: [{ id: '1', type: 'call', title: 'Discovery Call', description: 'Discussed requirements', date: '2024-01-15', duration: '30 min' }], tasks: [{ id: '1', title: 'Send proposal', dueDate: '2024-01-20', completed: false, priority: 'high' }] },
    { id: '2', name: 'Priya Patel', phone: '+91 87654 32109', email: 'priya@example.com', company: 'Digital Marketing Co', tags: ['New'], stage: 'New Lead', dealValue: 45000, lastActivity: '5 hours ago', avatar: 'PP', createdAt: '1/12/2024', leadScore: 'warm' },
    { id: '3', name: 'Amit Kumar', phone: '+91 76543 21098', email: 'amit@example.com', company: 'Global Traders', tags: ['Follow up'], stage: 'Contacted', dealValue: 120000, lastActivity: '1 day ago', avatar: 'AK', createdAt: '1/5/2024', leadScore: 'hot' },
    { id: '4', name: 'Sneha Gupta', phone: '+91 65432 10987', email: 'sneha@example.com', company: 'Fashion Hub', tags: ['Urgent'], stage: 'Proposal', dealValue: 200000, lastActivity: '3 hours ago', avatar: 'SG', createdAt: '12/28/2023', leadScore: 'hot' },
    { id: '5', name: 'Vikram Singh', phone: '+91 54321 09876', email: 'vikram@example.com', company: 'Auto Parts Ltd', tags: [], stage: 'Won', dealValue: 350000, lastActivity: '1 week ago', avatar: 'VS', createdAt: '12/15/2023', leadScore: 'warm' },
  ];

  const demoDeals: Deal[] = [
    { id: '1', contactId: '1', contactName: 'Rahul Sharma', title: 'Enterprise License', value: 85000, stage: 'Qualified', probability: 60, expectedClose: '2024-02-15', createdAt: '2024-01-10' },
    { id: '2', contactId: '4', contactName: 'Sneha Gupta', title: 'Annual Subscription', value: 200000, stage: 'Proposal', probability: 75, expectedClose: '2024-01-30', createdAt: '2024-01-05' },
    { id: '3', contactId: '5', contactName: 'Vikram Singh', title: 'Bulk Order', value: 350000, stage: 'Won', probability: 100, expectedClose: '2024-01-20', createdAt: '2023-12-15' },
  ];

  const demoInvoices: Invoice[] = [
    { id: '1', number: 'INV-2024-001', customerName: 'Rahul Sharma', customerEmail: 'rahul@example.com', customerPhone: '+91 98765 43210', items: [{ description: 'CRM License - Annual', quantity: 1, rate: 85000, amount: 85000 }], subtotal: 85000, tax: 15300, total: 100300, status: 'paid', date: '2024-01-15', dueDate: '2024-02-15', paidDate: '2024-01-20' },
    { id: '2', number: 'INV-2024-002', customerName: 'Sneha Gupta', customerEmail: 'sneha@example.com', customerPhone: '+91 65432 10987', items: [{ description: 'Enterprise Subscription', quantity: 1, rate: 200000, amount: 200000 }], subtotal: 200000, tax: 36000, total: 236000, status: 'sent', date: '2024-01-18', dueDate: '2024-02-18' },
  ];

  const demoLedger: LedgerEntry[] = [
    { id: '1', date: '2024-01-20', type: 'income', category: 'Sales', description: 'Invoice #INV-2024-001 - Rahul Sharma', amount: 100300, paymentMethod: 'bank', invoiceId: '1', contactName: 'Rahul Sharma' },
    { id: '2', date: '2024-01-18', type: 'expense', category: 'Software', description: 'AWS Hosting - Monthly', amount: 15000, paymentMethod: 'bank' },
    { id: '3', date: '2024-01-15', type: 'income', category: 'Sales', description: 'Deposit - Vikram Singh', amount: 100000, paymentMethod: 'upi' },
    { id: '4', date: '2024-01-12', type: 'expense', category: 'Salary', description: 'Staff Salary - January', amount: 250000, paymentMethod: 'bank' },
  ];

  const demoAppointments: Appointment[] = [
    { id: '1', title: 'Product Demo', clientName: 'Rahul Sharma', clientPhone: '+91 98765 43210', service: 'Enterprise Demo', date: '2024-01-25', time: '10:00', duration: 60, status: 'confirmed', reminder: true },
    { id: '2', title: 'Follow-up Call', clientName: 'Priya Patel', clientPhone: '+91 87654 32109', service: 'Sales Call', date: '2024-01-26', time: '14:00', duration: 30, status: 'scheduled', reminder: false },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [contactsRes] = await Promise.all([contactsAPI.list()]);
        const contactsData = contactsRes.data?.data || contactsRes.data || [];
        if (contactsData.length > 0) {
          setContacts(contactsData);
        } else {
          setContacts(demoContacts);
          setDeals(demoDeals);
          setInvoices(demoInvoices);
          setLedger(demoLedger);
          setAppointments(demoAppointments);
        }
      } catch {
        setContacts(demoContacts);
        setDeals(demoDeals);
        setInvoices(demoInvoices);
        setLedger(demoLedger);
        setAppointments(demoAppointments);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredContacts = contacts.filter(c =>
    (c.name.toLowerCase().includes(search.toLowerCase()) || c.company.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())) &&
    (stageFilter === 'all' || c.stage === stageFilter)
  );

  const totalDealValue = deals.reduce((sum, d) => sum + d.value, 0);
  const wonDeals = deals.filter(d => d.stage === 'Won').reduce((sum, d) => sum + d.value, 0);
  const totalRevenue = ledger.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = ledger.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
  const todayAppointments = appointments.filter(a => a.date === new Date().toISOString().split('T')[0]);

  const getLeadScoreColor = (score?: 'hot' | 'warm' | 'cold') => {
    if (score === 'hot') return 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400';
    if (score === 'warm') return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400';
    return 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400';
  };

  const handleAddContact = (contactData: any) => {
    const newContact: Contact = {
      ...contactData,
      id: `contact-${Date.now()}`,
      dealValue: 0,
      lastActivity: 'Just now',
      avatar: contactData.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
      createdAt: new Date().toLocaleDateString(),
    };
    setContacts(prev => [newContact, ...prev]);
    setShowAddModal(false);
  };

  const handleCreateInvoice = (invoiceData: any) => {
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `inv-${Date.now()}`,
      number: `INV-2024-${String(invoices.length + 1).padStart(3, '0')}`,
      status: 'draft',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };
    setInvoices(prev => [newInvoice, ...prev]);
    setShowInvoiceModal(false);
  };

  const handleCreateAppointment = (appointmentData: any) => {
    const newAppointment: Appointment = {
      ...appointmentData,
      id: `apt-${Date.now()}`,
      status: 'scheduled',
    };
    setAppointments(prev => [...prev, newAppointment]);
    setShowAppointmentModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CRM Suite</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage contacts, deals, invoices & appointments</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
            <UserPlus size={18} /> Add Contact
          </button>
          <button onClick={() => setShowInvoiceModal(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors">
            <FileText size={18} /> Create Invoice
          </button>
          <button onClick={() => setShowAppointmentModal(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors">
            <Calendar size={18} /> Book Appointment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 mb-1"><DollarSign size={14} /><span className="text-xs">Total Deals</span></div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">₹{(totalDealValue / 100000).toFixed(1)}L</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-green-500 mb-1"><TrendingUp size={14} /><span className="text-xs">Won</span></div>
          <p className="text-xl font-bold text-green-600">₹{(wonDeals / 100000).toFixed(1)}L</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 mb-1"><FileText size={14} /><span className="text-xs">Invoices</span></div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{invoices.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-green-500 mb-1"><TrendingUp size={14} /><span className="text-xs">Revenue</span></div>
          <p className="text-xl font-bold text-green-600">₹{(totalRevenue / 100000).toFixed(1)}L</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-red-500 mb-1"><span className="text-xs">Expenses</span></div>
          <p className="text-xl font-bold text-red-600">₹{(totalExpenses / 100000).toFixed(1)}L</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-purple-500 mb-1"><Calendar size={14} /><span className="text-xs">Today</span></div>
          <p className="text-xl font-bold text-purple-600">{todayAppointments.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
        <div className="flex gap-4 min-w-max">
          {(['contacts', 'deals', 'invoices', 'ledger', 'appointments'] as const).map(tab => (
            <button key={tab} onClick={() => setViewMode(tab)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${viewMode === tab ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 border-transparent'}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'contacts' && ` (${contacts.length})`}
              {tab === 'deals' && ` (${deals.length})`}
              {tab === 'invoices' && ` (${invoices.length})`}
              {tab === 'appointments' && ` (${appointments.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800" />
        </div>
        {viewMode === 'contacts' && (
          <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800">
            <option value="all">All Stages</option>
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>

      {/* Contacts View */}
      {viewMode === 'contacts' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deal Value</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredContacts.map(contact => (
                  <tr key={contact.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                          {contact.avatar}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{contact.name}</p>
                          <p className="text-xs text-gray-500">{contact.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hidden md:table-cell">{contact.company}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STAGE_COLORS[contact.stage]}`}>{contact.stage}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">₹{contact.dealValue.toLocaleString()}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {contact.leadScore && <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLeadScoreColor(contact.leadScore)}`}>{contact.leadScore.toUpperCase()}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 text-gray-500 hover:text-blue-600"><Phone size={16} /></button>
                        <button className="p-1.5 text-gray-500 hover:text-blue-600"><Mail size={16} /></button>
                        <button onClick={() => setSelectedContact(contact)} className="p-1.5 text-gray-500 hover:text-blue-600"><Eye size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Deals View */}
      {viewMode === 'deals' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deals.map(deal => (
            <div key={deal.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${STAGE_COLORS[deal.stage]}`}>{deal.stage}</span>
                <span className="text-xs text-gray-500">{deal.probability}% likely</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{deal.title}</h3>
              <p className="text-sm text-gray-500 mb-2">{deal.contactName}</p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-green-600">₹{deal.value.toLocaleString()}</span>
                <span className="text-xs text-gray-400">Close: {deal.expectedClose}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invoices View */}
      {viewMode === 'invoices' && (
        <div className="space-y-4">
          {invoices.map(invoice => (
            <div key={invoice.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">{invoice.number}</span>
                  <p className="text-sm text-gray-500">{invoice.customerName}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${invoice.status === 'paid' ? 'bg-green-100 text-green-700' : invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' : invoice.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                  {invoice.status.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  <span>Date: {invoice.date}</span> • <span>Due: {invoice.dueDate}</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">₹{invoice.total.toLocaleString()}</span>
              </div>
              {invoice.status !== 'paid' && (
                <button className="mt-3 w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                  Mark as Paid
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ledger View */}
      {viewMode === 'ledger' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-600 mb-1">Total Income</p>
              <p className="text-2xl font-bold text-green-600">₹{totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 mb-1">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">₹{totalExpenses.toLocaleString()}</p>
            </div>
          </div>
          {ledger.map(entry => (
            <div key={entry.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${entry.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {entry.type === 'income' ? <TrendingUp size={18} /> : <DollarSign size={18} />}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{entry.description}</p>
                  <p className="text-sm text-gray-500">{entry.category} • {entry.paymentMethod}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${entry.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {entry.type === 'income' ? '+' : '-'}₹{entry.amount.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">{entry.date}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Appointments View */}
      {viewMode === 'appointments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appointments.map(apt => (
            <div key={apt.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${apt.status === 'confirmed' ? 'bg-green-100 text-green-700' : apt.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                  {apt.status.toUpperCase()}
                </span>
                {apt.reminder && <Bell size={14} className="text-yellow-500" />}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{apt.title}</h3>
              <p className="text-sm text-gray-500 mb-2">{apt.clientName} • {apt.service}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Calendar size={14} /> {apt.date}</span>
                <span className="flex items-center gap-1"><Clock size={14} /> {apt.time}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <button className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Confirm</button>
                <button className="flex-1 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Reschedule</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contact Detail Modal */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {selectedContact.avatar}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedContact.name}</h2>
                  <p className="text-gray-500">{selectedContact.company}</p>
                </div>
              </div>
              <button onClick={() => setSelectedContact(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <p className="font-medium">{selectedContact.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Phone</p>
                  <p className="font-medium">{selectedContact.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Deal Value</p>
                  <p className="font-bold text-green-600">₹{selectedContact.dealValue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Lead Score</p>
                  {selectedContact.leadScore && <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLeadScoreColor(selectedContact.leadScore)}`}>{selectedContact.leadScore.toUpperCase()}</span>}
                </div>
              </div>

              {selectedContact.notes && selectedContact.notes.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Notes</h3>
                  <div className="space-y-2">
                    {selectedContact.notes.map(note => (
                      <div key={note.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">{note.content}</p>
                        <p className="text-xs text-gray-400 mt-1">{note.createdAt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedContact.tasks && selectedContact.tasks.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Tasks</h3>
                  <div className="space-y-2">
                    {selectedContact.tasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={task.completed} className="rounded" />
                          <span className={task.completed ? 'line-through text-gray-400' : ''}>{task.title}</span>
                        </div>
                        <span className={`text-xs ${task.priority === 'high' ? 'text-red-500' : task.priority === 'medium' ? 'text-yellow-500' : 'text-gray-500'}`}>{task.dueDate}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <AddContactModal onClose={() => setShowAddModal(false)} onAdd={handleAddContact} />
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <InvoiceModal contacts={contacts} onClose={() => setShowInvoiceModal(false)} onCreate={handleCreateInvoice} />
      )}

      {/* Appointment Modal */}
      {showAppointmentModal && (
        <AppointmentModal contacts={contacts} onClose={() => setShowAppointmentModal(false)} onCreate={handleCreateAppointment} />
      )}
    </div>
  );
}

// Add Contact Modal
const AddContactModal: React.FC<{ onClose: () => void; onAdd: (contact: any) => void }> = ({ onClose, onAdd }) => {
  const [form, setForm] = useState({ name: '', phone: '', email: '', company: '', tags: '', stage: 'New Lead', dealValue: '', leadScore: 'warm' });

  const handleSubmit = () => {
    if (!form.name || !form.phone) return;
    onAdd({
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      dealValue: parseInt(form.dealValue) || 0,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add New Contact</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={20} /></button>
        </div>
        <div className="p-4 space-y-4">
          <div><label className="block text-sm font-medium mb-1">Name *</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">Phone *</label><input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">Company</label><input type="text" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium mb-1">Stage</label><select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })} className="w-full px-3 py-2 border rounded-lg">{STAGES.map(s => <option key={s}>{s}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1">Lead Score</label><select value={form.leadScore} onChange={e => setForm({ ...form, leadScore: e.target.value })} className="w-full px-3 py-2 border rounded-lg"><option value="hot">Hot</option><option value="warm">Warm</option><option value="cold">Cold</option></select></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">Deal Value (₹)</label><input type="number" value={form.dealValue} onChange={e => setForm({ ...form, dealValue: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">Tags (comma separated)</label><input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="VIP, Hot Lead" className="w-full px-3 py-2 border rounded-lg" /></div>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Contact</button>
        </div>
      </div>
    </div>
  );
};

// Invoice Modal
const InvoiceModal: React.FC<{ contacts: Contact[]; onClose: () => void; onCreate: (invoice: any) => void }> = ({ contacts, onClose, onCreate }) => {
  const [form, setForm] = useState({ customerId: '', items: [{ description: '', quantity: 1, rate: 0 }], taxRate: 18 });
  const selectedContact = contacts.find(c => c.id === form.customerId);

  const subtotal = form.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const tax = (subtotal * form.taxRate) / 100;
  const total = subtotal + tax;

  const addItem = () => setForm({ ...form, items: [...form.items, { description: '', quantity: 1, rate: 0 }] });
  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setForm({ ...form, items: newItems });
  };

  const handleCreate = () => {
    if (!selectedContact || form.items.length === 0) return;
    onCreate({
      customerName: selectedContact.name,
      customerEmail: selectedContact.email,
      customerPhone: selectedContact.phone,
      items: form.items.map(i => ({ ...i, amount: i.quantity * i.rate })),
      subtotal,
      tax,
      total,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Invoice</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={20} /></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Customer</label>
            <select value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
              <option value="">Select Customer</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.name} - {c.company}</option>)}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Items</label>
              <button onClick={addItem} className="text-sm text-blue-600 hover:text-blue-700">+ Add Item</button>
            </div>
            {form.items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 mb-2">
                <input type="text" placeholder="Description" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} className="col-span-6 px-3 py-2 border rounded-lg" />
                <input type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value))} className="col-span-2 px-3 py-2 border rounded-lg" />
                <input type="number" placeholder="Rate" value={item.rate} onChange={e => updateItem(i, 'rate', parseFloat(e.target.value))} className="col-span-3 px-3 py-2 border rounded-lg" />
                <span className="col-span-1 flex items-center justify-center font-bold">₹{item.quantity * item.rate}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <label className="text-sm font-medium mr-2">Tax Rate (%)</label>
              <input type="number" value={form.taxRate} onChange={e => setForm({ ...form, taxRate: parseFloat(e.target.value) || 0 })} className="w-20 px-3 py-2 border rounded-lg" />
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Subtotal: ₹{subtotal.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Tax ({form.taxRate}%): ₹{tax.toLocaleString()}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">Total: ₹{total.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleCreate} className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Create Invoice</button>
        </div>
      </div>
    </div>
  );
};

// Appointment Modal
const AppointmentModal: React.FC<{ contacts: Contact[]; onClose: () => void; onCreate: (apt: any) => void }> = ({ contacts, onClose, onCreate }) => {
  const [form, setForm] = useState({ clientId: '', title: '', service: '', date: '', time: '', duration: 30, reminder: true });

  const handleCreate = () => {
    if (!form.title || !form.date || !form.time) return;
    const contact = contacts.find(c => c.id === form.clientId);
    onCreate({
      title: form.title,
      clientName: contact?.name || 'Walk-in',
      clientPhone: contact?.phone || '',
      service: form.service,
      date: form.date,
      time: form.time,
      duration: form.duration,
      reminder: form.reminder,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Book Appointment</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={20} /></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Client</label>
            <select value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
              <option value="">Select Client (optional)</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">Title *</label><input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Product Demo" className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">Service</label><input type="text" value={form.service} onChange={e => setForm({ ...form, service: e.target.value })} placeholder="Consultation" className="w-full px-3 py-2 border rounded-lg" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium mb-1">Date *</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Time *</label><input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="reminder" checked={form.reminder} onChange={e => setForm({ ...form, reminder: e.target.checked })} />
            <label htmlFor="reminder" className="text-sm">Send reminder</label>
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleCreate} className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Book</button>
        </div>
      </div>
    </div>
  );
};
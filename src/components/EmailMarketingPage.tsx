import React, { useState, useEffect } from 'react';
import { Mail, Send, Clock, BarChart3, Users, Plus, Play, Pause, Eye, Trash2, Zap, MessageSquare } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent';
  recipients: number;
  sent?: number;
  delivered?: number;
  opened?: number;
  clicked?: number;
}

interface DripSequence {
  id: string;
  name: string;
  trigger: string;
  emails: number;
  isActive: boolean;
}

const demoTemplates: EmailTemplate[] = [
  { id: '1', name: 'Welcome Email', subject: 'Welcome to {{company}}!', body: 'Welcome content...', variables: ['name', 'company'] },
  { id: '2', name: 'Follow Up', subject: 'Following up on our conversation', body: 'Follow up content...', variables: ['name'] },
  { id: '3', name: 'Newsletter', subject: '{{company}} Monthly Update', body: 'Newsletter content...', variables: ['company'] },
];

const demoCampaigns: EmailCampaign[] = [
  { id: '1', name: 'New Year Sale', subject: '🎉 New Year Special Offer!', status: 'sent', recipients: 450, sent: 450, delivered: 432, opened: 156, clicked: 45 },
  { id: '2', name: 'Product Launch', subject: 'Introducing Our New Feature', status: 'scheduled', recipients: 380 },
  { id: '3', name: 'Re-engagement', subject: 'We Miss You!', status: 'draft', recipients: 200 },
];

const demoDrips: DripSequence[] = [
  { id: '1', name: 'New Lead Nurture', trigger: 'signup', emails: 5, isActive: true },
  { id: '2', name: 'Cart Abandonment', trigger: 'custom', emails: 3, isActive: true },
];

export default function EmailMarketingPage() {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates' | 'drips'>('campaigns');
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>(demoCampaigns);
  const [templates, setTemplates] = useState<EmailTemplate[]>(demoTemplates);
  const [drips, setDrips] = useState<DripSequence[]>(demoDrips);
  const [showCompose, setShowCompose] = useState(false);

  const stats = {
    totalSent: campaigns.reduce((s, c) => s + (c.sent || 0), 0),
    avgOpenRate: '32.4%',
    avgClickRate: '8.2%',
    activeDrips: drips.filter(d => d.isActive).length,
  };

  const sendCampaign = (id: string) => {
    setCampaigns(prev => prev.map(c => 
      c.id === id ? { ...c, status: 'sending' as any } : c
    ));
    setTimeout(() => {
      setCampaigns(prev => prev.map(c => 
        c.id === id ? { ...c, status: 'sent', sent: c.recipients, delivered: Math.floor(c.recipients * 0.96), opened: Math.floor(c.recipients * 0.32), clicked: Math.floor(c.recipients * 0.08) } : c
      ));
    }, 2000);
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Email Marketing</h1>
          <p className="text-gray-500 dark:text-gray-400">Create campaigns, automated sequences & track performance</p>
        </div>
        <button onClick={() => setShowCompose(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all">
          <Plus size={18} /> Compose
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 mb-2"><Send size={16} /><span className="text-sm">Total Sent</span></div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSent.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 mb-2"><Eye size={16} /><span className="text-sm">Avg Open Rate</span></div>
          <p className="text-2xl font-bold text-green-600">{stats.avgOpenRate}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 mb-2"><Zap size={16} /><span className="text-sm">Click Rate</span></div>
          <p className="text-2xl font-bold text-blue-600">{stats.avgClickRate}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 mb-2"><MessageSquare size={16} /><span className="text-sm">Active Drips</span></div>
          <p className="text-2xl font-bold text-purple-600">{stats.activeDrips}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex gap-4">
          {(['campaigns', 'templates', 'drips'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Campaigns */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {campaigns.map(campaign => (
            <div key={campaign.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{campaign.name}</h3>
                  <p className="text-sm text-gray-500">{campaign.subject}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${campaign.status === 'sent' ? 'bg-green-100 text-green-700' : campaign.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : campaign.status === 'sending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                  {campaign.status.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>{campaign.recipients} recipients</span>
                  {campaign.opened && <span>{campaign.opened} opened ({Math.round(campaign.opened / campaign.sent! * 100)}%)</span>}
                  {campaign.clicked && <span>{campaign.clicked} clicked</span>}
                </div>
                <div className="flex gap-2">
                  {campaign.status === 'draft' && <button onClick={() => sendCampaign(campaign.id)} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Send</button>}
                  {campaign.status === 'scheduled' && <button className="px-3 py-1.5 border border-gray-300 text-sm rounded-lg">Edit</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Templates */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <div key={template.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{template.name}</h3>
              <p className="text-sm text-gray-500 mb-2">{template.subject}</p>
              <div className="flex flex-wrap gap-1">
                {template.variables.map(v => (
                  <span key={v} className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs rounded">
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
            </div>
          ))}
          <button onClick={() => {}} className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 flex items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors">
            <Plus size={20} /> Create Template
          </button>
        </div>
      )}

      {/* Drip Sequences */}
      {activeTab === 'drips' && (
        <div className="space-y-4">
          {drips.map(drip => (
            <div key={drip.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{drip.name}</h3>
                  <p className="text-sm text-gray-500">Trigger: {drip.trigger} • {drip.emails} emails</p>
                </div>
                <div className="flex items-center gap-3">
                  <button className={`px-3 py-1.5 rounded-lg text-sm ${drip.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {drip.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button className="p-2 text-gray-500 hover:text-blue-600"><Play size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
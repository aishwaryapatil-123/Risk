import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Database, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  BarChart3, 
  Users, 
  Server, 
  FileText, 
  CheckCircle2,
  XCircle,
  Info,
  LayoutDashboard,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Asset, Risk } from './types';

const COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444'];
const RISK_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'assets' | 'risks'>('dashboard');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newAsset, setNewAsset] = useState({ name: '', type: 'System', description: '', owner: '' });
  const [newRisk, setNewRisk] = useState({ 
    asset_id: 0, 
    threat: '', 
    vulnerability: '', 
    likelihood: 3, 
    impact: 3, 
    mitigation_strategy: '' 
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assetsRes, risksRes] = await Promise.all([
        fetch('/api/assets'),
        fetch('/api/risks')
      ]);
      const assetsData = await assetsRes.json();
      const risksData = await risksRes.json();
      setAssets(assetsData);
      setRisks(risksData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAsset)
      });
      setNewAsset({ name: '', type: 'System', description: '', owner: '' });
      fetchData();
    } catch (error) {
      console.error('Error adding asset:', error);
    }
  };

  const deleteAsset = async (id: number) => {
    if (!confirm('Deleting an asset will also delete all associated risk assessments. Continue?')) return;
    try {
      await fetch(`/api/assets/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting asset:', error);
    }
  };

  const addRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newRisk.asset_id === 0) {
      alert('Please select an asset');
      return;
    }
    try {
      await fetch('/api/risks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRisk)
      });
      setNewRisk({ asset_id: 0, threat: '', vulnerability: '', likelihood: 3, impact: 3, mitigation_strategy: '' });
      fetchData();
    } catch (error) {
      console.error('Error adding risk:', error);
    }
  };

  const deleteRisk = async (id: number) => {
    try {
      await fetch(`/api/risks/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting risk:', error);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Critical': return 'bg-red-500 text-white';
      case 'High': return 'bg-orange-500 text-white';
      case 'Medium': return 'bg-amber-500 text-white';
      case 'Low': return 'bg-emerald-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRiskData = () => {
    const counts = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    risks.forEach(r => {
      counts[r.risk_level as keyof typeof counts]++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  const renderDashboard = () => {
    const riskData = getRiskData();
    const criticalCount = risks.filter(r => r.risk_level === 'Critical').length;
    const totalAssets = assets.length;
    const totalRisks = risks.length;

    return (
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={<Database className="text-blue-500" />} label="Total Assets" value={totalAssets} />
          <StatCard icon={<Shield className="text-emerald-500" />} label="Identified Risks" value={totalRisks} />
          <StatCard icon={<AlertTriangle className="text-red-500" />} label="Critical Risks" value={criticalCount} />
          <StatCard icon={<Activity className="text-purple-500" />} label="Avg Risk Score" value={totalRisks ? (risks.reduce((a, b) => a + b.risk_score, 0) / totalRisks).toFixed(1) : 0} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Risk Matrix */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-500" />
              Risk Heatmap (Likelihood vs Impact)
            </h3>
            <div className="relative">
              <div className="grid grid-cols-6 gap-1">
                <div className="col-span-1"></div>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="text-center text-xs font-medium text-gray-400 pb-2">Impact {i}</div>
                ))}
                {[5, 4, 3, 2, 1].map(l => (
                  <>
                    <div key={`l-${l}`} className="text-right text-xs font-medium text-gray-400 pr-2 flex items-center justify-end">L{l}</div>
                    {[1, 2, 3, 4, 5].map(i => {
                      const score = l * i;
                      let color = 'bg-emerald-100 text-emerald-700';
                      if (score >= 15) color = 'bg-red-500 text-white';
                      else if (score >= 10) color = 'bg-orange-400 text-white';
                      else if (score >= 5) color = 'bg-amber-200 text-amber-800';
                      
                      const count = risks.filter(r => r.likelihood === l && r.impact === i).length;
                      
                      return (
                        <div key={`${l}-${i}`} className={`aspect-square rounded-md flex items-center justify-center text-sm font-bold ${color} transition-all hover:scale-105 cursor-help relative group`}>
                          {count > 0 ? count : ''}
                          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                            Score: {score} | {count} Risks
                          </div>
                        </div>
                      );
                    })}
                  </>
                ))}
              </div>
            </div>
            <div className="mt-6 flex justify-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-100 rounded"></div> Low</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-200 rounded"></div> Medium</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-400 rounded"></div> High</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded"></div> Critical</div>
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-500" />
              Risk Level Distribution
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Risks Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-bottom border-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-semibold">Critical & High Priority Risks</h3>
            <button onClick={() => setActiveTab('risks')} className="text-sm text-blue-600 font-medium hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-medium">Asset</th>
                  <th className="px-6 py-3 font-medium">Threat</th>
                  <th className="px-6 py-3 font-medium">Score</th>
                  <th className="px-6 py-3 font-medium">Level</th>
                  <th className="px-6 py-3 font-medium">Mitigation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {risks.filter(r => r.risk_score >= 10).map(risk => (
                  <tr key={risk.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{risk.asset_name}</td>
                    <td className="px-6 py-4 text-gray-600">{risk.threat}</td>
                    <td className="px-6 py-4 font-mono font-bold">{risk.risk_score}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getRiskColor(risk.risk_level)}`}>
                        {risk.risk_level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{risk.mitigation_strategy}</td>
                  </tr>
                ))}
                {risks.filter(r => r.risk_score >= 10).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400 italic">No high priority risks identified yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderAssets = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Add Asset Form */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-8">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-500" />
            Add New Asset
          </h3>
          <form onSubmit={addAsset} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Asset Name</label>
              <input 
                required
                type="text" 
                value={newAsset.name}
                onChange={e => setNewAsset({...newAsset, name: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="e.g. Database Server"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Type</label>
              <select 
                value={newAsset.type}
                onChange={e => setNewAsset({...newAsset, type: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              >
                <option>System</option>
                <option>Data</option>
                <option>People</option>
                <option>Process</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Owner</label>
              <input 
                type="text" 
                value={newAsset.owner}
                onChange={e => setNewAsset({...newAsset, owner: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="e.g. IT Dept"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Description</label>
              <textarea 
                value={newAsset.description}
                onChange={e => setNewAsset({...newAsset, description: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all h-24 resize-none"
                placeholder="Briefly describe the asset..."
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Add Asset
            </button>
          </form>
        </div>
      </div>

      {/* Assets List */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-bottom border-gray-50">
            <h3 className="text-lg font-semibold">Organizational Assets</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Owner</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {assets.map(asset => (
                  <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{asset.name}</div>
                      <div className="text-xs text-gray-500">{asset.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold uppercase">
                        {asset.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{asset.owner}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => deleteAsset(asset.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {assets.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400 italic">No assets registered yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRisks = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Add Risk Form */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-8">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" />
            New Assessment
          </h3>
          <form onSubmit={addRisk} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Target Asset</label>
              <select 
                required
                value={newRisk.asset_id}
                onChange={e => setNewRisk({...newRisk, asset_id: parseInt(e.target.value)})}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              >
                <option value={0}>Select Asset...</option>
                {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Threat</label>
              <input 
                required
                type="text" 
                value={newRisk.threat}
                onChange={e => setNewRisk({...newRisk, threat: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="e.g. Ransomware"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Vulnerability</label>
              <input 
                required
                type="text" 
                value={newRisk.vulnerability}
                onChange={e => setNewRisk({...newRisk, vulnerability: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="e.g. Weak Passwords"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Likelihood (1-5)</label>
                <input 
                  type="number" min="1" max="5"
                  value={newRisk.likelihood}
                  onChange={e => setNewRisk({...newRisk, likelihood: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Impact (1-5)</label>
                <input 
                  type="number" min="1" max="5"
                  value={newRisk.impact}
                  onChange={e => setNewRisk({...newRisk, impact: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Mitigation Strategy</label>
              <textarea 
                value={newRisk.mitigation_strategy}
                onChange={e => setNewRisk({...newRisk, mitigation_strategy: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all h-24 resize-none"
                placeholder="How will you address this risk?"
              />
            </div>
            <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Save Assessment
            </button>
          </form>
        </div>
      </div>

      {/* Risks List */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-bottom border-gray-50">
            <h3 className="text-lg font-semibold">Risk Register</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-medium">Asset / Threat</th>
                  <th className="px-6 py-3 font-medium text-center">Score</th>
                  <th className="px-6 py-3 font-medium">Level</th>
                  <th className="px-6 py-3 font-medium">Mitigation</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {risks.map(risk => (
                  <tr key={risk.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{risk.asset_name}</div>
                      <div className="text-xs text-gray-500">{risk.threat}</div>
                      <div className="text-[10px] text-gray-400 italic">Vuln: {risk.vulnerability}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-mono font-bold text-lg">{risk.risk_score}</div>
                      <div className="text-[10px] text-gray-400">{risk.likelihood}L x {risk.impact}I</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getRiskColor(risk.risk_level)}`}>
                        {risk.risk_level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                      {risk.mitigation_strategy || 'No strategy defined.'}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => deleteRisk(risk.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {risks.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400 italic">No risk assessments performed yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-gray-50">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight">CyberRisk</h1>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Manager v1.0</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem 
            icon={<LayoutDashboard className="w-5 h-5" />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<Database className="w-5 h-5" />} 
            label="Assets" 
            active={activeTab === 'assets'} 
            onClick={() => setActiveTab('assets')} 
          />
          <NavItem 
            icon={<Shield className="w-5 h-5" />} 
            label="Risk Register" 
            active={activeTab === 'risks'} 
            onClick={() => setActiveTab('risks')} 
          />
        </nav>

        <div className="p-4 border-t border-gray-50">
          <div className="bg-gray-50 p-4 rounded-2xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Intern Role</p>
                <p className="text-[10px] text-gray-500">Risk Analyst</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full w-3/4"></div>
            </div>
            <p className="text-[10px] text-gray-400 mt-2 font-medium">Project Completion: 75%</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-20">
          <h2 className="text-xl font-bold text-gray-900 capitalize">{activeTab}</h2>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-bold text-gray-900">Aishwarya Patil</p>
              <p className="text-[10px] text-gray-500">Risk Analyst Intern</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-full border-2 border-white shadow-sm overflow-hidden">
              <img src="https://picsum.photos/seed/cyber/100/100" alt="Profile" />
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  {activeTab === 'dashboard' && renderDashboard()}
                  {activeTab === 'assets' && renderAssets()}
                  {activeTab === 'risks' && renderRisks()}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
        active 
          ? 'bg-blue-50 text-blue-600 shadow-sm' 
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-xl">
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

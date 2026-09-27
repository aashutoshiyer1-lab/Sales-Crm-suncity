import React, { useState, useMemo } from 'react';
import { VENUES, CLOSING_STAFF } from '../config/venueData';
import { 
  MessageSquareText, 
  Copy, 
  Check, 
  Send, 
  Calendar as CalendarIcon, 
  User, 
  Sparkles, 
  FileText,
  RotateCcw,
  CheckCircle2,
  Lock,
  Gamepad2,
  DollarSign
} from 'lucide-react';

export const ClosingMessageGenerator = ({ bookings = [] }) => {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedStaff, setSelectedStaff] = useState(CLOSING_STAFF[3] || 'Junaid'); // Default Junaid
  const [copied, setCopied] = useState(false);

  // Per-game user editable Excess and Notes
  const [excesses, setExcesses] = useState({
    laser: '00',
    bank_heist: '00',
    locked_in: '00',
    phonebooth: '00',
    haunted_elevator: '00',
    bunker: '00',
  });

  const [notes, setNotes] = useState({
    laser: '**',
    bank_heist: '**',
    locked_in: '',
    phonebooth: '',
    haunted_elevator: '',
    bunker: '**',
  });

  const handleExcessChange = (key, val) => {
    setExcesses(prev => ({ ...prev, [key]: val }));
  };

  const handleNoteChange = (key, val) => {
    setNotes(prev => ({ ...prev, [key]: val }));
  };

  // Quick date pickers
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  // Format DD-MM-YYYY
  const formattedDate = useMemo(() => {
    if (!selectedDate) return '';
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return selectedDate;
  }, [selectedDate]);

  // Filter bookings for the selected date (excluding cancelled)
  const dayBookings = useMemo(() => {
    return bookings.filter(b => b.date === selectedDate && b.status !== 'Cancelled');
  }, [bookings, selectedDate]);

  // Two-digit pad helper
  const pad = (n) => String(n || 0).padStart(2, '0');

  // Compute metrics for LASER SHOOTER
  const laserMetrics = useMemo(() => {
    const laserBookings = dayBookings.filter(b => b.venue === VENUES.LASER_SHOOTER);
    let sessions = laserBookings.length;
    let totalGames = 0;
    let pax10 = 0;
    let pax20 = 0;
    let pax30 = 0;
    let discountPax30 = 0;
    let staffPax = 0;
    let compPax = 0;
    let totalSale = 0;

    laserBookings.forEach(b => {
      const pax = Number(b.paxCount) || 0;
      const amount = Number(b.totalAmount) || 0;
      const gName = (b.gameName || '').toLowerCase();
      const isComp = b.offerId === 'complimentary';
      const isDiscount = b.offerId && b.offerId !== 'none' && !isComp;

      totalGames += pax;
      totalSale += amount;

      if (isComp) {
        compPax += pax;
      }

      if (gName.includes('10') || gName.includes('combat')) {
        pax10 += pax;
      } else if (gName.includes('20') || gName.includes('battle')) {
        pax20 += pax;
      } else if (gName.includes('30') || gName.includes('war')) {
        pax30 += pax;
        if (isDiscount) {
          discountPax30 += pax;
        }
      }
    });

    return {
      sessions,
      totalGames,
      pax10,
      pax20,
      pax30,
      discountPax30,
      staffPax,
      compPax,
      totalSale,
    };
  }, [dayBookings]);

  // Compute metrics for ESCAPE TIME GAMES
  const escapeMetrics = useMemo(() => {
    const escapeBookings = dayBookings.filter(b => b.venue === VENUES.ESCAPE_TIME);

    const initCategory = () => ({
      sessions: 0,
      totalGames: 0,
      discountGames: 0,
      complimentary: 0,
      staffGames: 0,
      totalSale: 0,
    });

    const categories = {
      bank_heist: initCategory(),
      locked_in: initCategory(),
      phonebooth: initCategory(),
      haunted_elevator: initCategory(),
      bunker: initCategory(),
    };

    escapeBookings.forEach(b => {
      const pax = Number(b.paxCount) || 0;
      const amount = Number(b.totalAmount) || 0;
      const gName = (b.gameName || '').toLowerCase();
      const isComp = b.offerId === 'complimentary';
      const isDiscount = b.offerId && b.offerId !== 'none' && !isComp;

      let key = null;
      if (gName.includes('bank') || gName.includes('heist')) {
        key = 'bank_heist';
      } else if (gName.includes('locked')) {
        key = 'locked_in';
      } else if (gName.includes('phone')) {
        key = 'phonebooth';
      } else if (gName.includes('elevator') || gName.includes('haunted')) {
        key = 'haunted_elevator';
      } else if (gName.includes('bunker') || gName.includes('war')) {
        key = 'bunker';
      }

      if (key && categories[key]) {
        categories[key].sessions += 1;
        categories[key].totalGames += pax;
        categories[key].totalSale += amount;
        if (isComp) categories[key].complimentary += pax;
        if (isDiscount) categories[key].discountGames += pax;
      }
    });

    return categories;
  }, [dayBookings]);

  // Overall Sale
  const overallSale = useMemo(() => {
    const escapeTotal = Object.values(escapeMetrics).reduce((sum, g) => sum + g.totalSale, 0);
    return laserMetrics.totalSale + escapeTotal;
  }, [laserMetrics, escapeMetrics]);

  // Build the Exact WhatsApp Formatted Message String
  const generatedClosingMessage = useMemo(() => {
    const bh = escapeMetrics.bank_heist;
    const li = escapeMetrics.locked_in;
    const pb = escapeMetrics.phonebooth;
    const he = escapeMetrics.haunted_elevator;
    const bk = escapeMetrics.bunker;

    const laserSaleStr = laserMetrics.totalSale > 0 ? `*${laserMetrics.totalSale}*/-` : '*00*';
    const bhSaleStr = bh.totalSale > 0 ? `*${bh.totalSale}*` : '*00*';
    const liSaleStr = li.totalSale > 0 ? `*${li.totalSale}*` : '*00*';
    const pbSaleStr = pb.totalSale > 0 ? `*${pb.totalSale}*` : '*00*';
    const heSaleStr = he.totalSale > 0 ? `*${he.totalSale}*` : '*00*';
    const bkSaleStr = bk.totalSale > 0 ? `*${bk.totalSale}*` : '*00*';

    return `*Assalamualaikum*
*${formattedDate}*

*LASER SHOOTER SALES*
No: of sessions:- *${pad(laserMetrics.sessions)}*
Total  Games: *${pad(laserMetrics.totalGames)}*
10 mins  game: *${pad(laserMetrics.pax10)}*
20 min games: *${pad(laserMetrics.pax20)}*
30 mins games: *${pad(laserMetrics.pax30)}*
30 mins discount: *${pad(laserMetrics.discountPax30)}*
Staff game: *${pad(laserMetrics.staffPax)}*
Complementary game : *${pad(laserMetrics.compPax)}*
Total sale:- ${laserSaleStr}
Excess:- *${excesses.laser || '00'}*

Note:-  ${notes.laser || '**'}
  
*ESCAPE TIME SALES*

       *Bank Heist*
No. of sessions:- *${pad(bh.sessions)}*
Total games :- *${pad(bh.totalGames)}*
Discount games:- *${pad(bh.discountGames)}*
Complimentary:- *${pad(bh.complimentary)}*
Total sale:- ${bhSaleStr}
Excess:- *${excesses.bank_heist || '00'}*
Note:- ${notes.bank_heist || '**'} 

       *Locked in*
No of sessions:- *${pad(li.sessions)}*
Total games :- *${pad(li.totalGames)}*
Staff games: *${pad(li.staffGames)}*
Discount games: *${pad(li.discountGames)}*
Total sale:${liSaleStr}
Excess :- *${excesses.locked_in || '00'}*
Note:- ${notes.locked_in || ''}

    *Phone booth*
No: of sessions: *${pad(pb.sessions)}*
Total games:- *${pad(pb.totalGames)}*
Discount games:- *${pad(pb.discountGames)}*
Complimentary games:- *${pad(pb.complimentary)}*
Staff games: *${pad(pb.staffGames)}*
Total sale:- ${pbSaleStr}
Excess: *${excesses.phonebooth || '00'}*

    *Haunted Elevator*
No: of sessions: *${pad(he.sessions)}*
Total games:- *${pad(he.totalGames)}*
Complimentary games:- *${pad(he.complimentary)}*
Discount games:- *${pad(he.discountGames)}*
Staff games: *${pad(he.staffGames)}*
Total sale:- ${heSaleStr}
Excess: *${excesses.haunted_elevator || '00'}*

         *Bunker*
No:of session:*${pad(bk.sessions)}*
Total games:*${pad(bk.totalGames)}*
Discount games:*${pad(bk.discountGames)}*
Complimentary games:- *${pad(bk.complimentary)}*
Total sale:- ${bkSaleStr}
Excess:-*${excesses.bunker || '00'}*

Note:- ${notes.bunker || '**'} 
 

*Overall sale* :- *${overallSale}*/-

*${selectedStaff}*`;
  }, [
    formattedDate, 
    laserMetrics, 
    escapeMetrics, 
    overallSale, 
    selectedStaff, 
    excesses, 
    notes
  ]);

  const handleCopyMessage = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(generatedClosingMessage).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = generatedClosingMessage;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(generatedClosingMessage);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Suncity Branch Daily Closing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Closing Message Generator
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
            Auto-calculates sessions, player counts, complimentary entries, discounts, and formats standard WhatsApp closing reports.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-2 rounded-xl transition-all ${
                selectedDate === todayStr 
                  ? 'bg-white text-cyan-800 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setSelectedDate(yesterdayStr)}
              className={`px-3 py-2 rounded-xl transition-all ${
                selectedDate === yesterdayStr 
                  ? 'bg-white text-cyan-800 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yesterday
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white border border-slate-300 text-xs font-semibold shadow-sm">
            <CalendarIcon className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-slate-900 focus:outline-none font-mono cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Staff Duty Selector */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200">
            <User className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Staff on Duty (Closing By)
            </span>
            <span className="text-xs text-slate-500">
              Selected name will be formatted at the bottom of the closing report.
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {CLOSING_STAFF.map((staff) => (
            <button
              key={staff}
              onClick={() => setSelectedStaff(staff)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedStaff === staff
                  ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-md scale-105'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {staff}
            </button>
          ))}
        </div>
      </div>

      {/* Two Column Layout: Metrics + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Metrics Breakdown & Editable Fields (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Laser Shooter Section */}
          <div className="bg-white rounded-3xl p-6 border border-cyan-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Laser Shooter Sales</h3>
                  <p className="text-xs text-slate-500 font-mono">Arena Mode Breakdown</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-500">Total Sale:</span>
                <span className="ml-1 text-base font-extrabold text-cyan-700 font-mono">
                  ₹{laserMetrics.totalSale.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Quick Grid of Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sessions</span>
                <span className="text-lg font-extrabold text-slate-900 font-mono">{pad(laserMetrics.sessions)}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Games</span>
                <span className="text-lg font-extrabold text-slate-900 font-mono">{pad(laserMetrics.totalGames)}</span>
              </div>
              <div className="p-3 rounded-2xl bg-cyan-50/50 border border-cyan-100">
                <span className="text-[10px] font-bold text-cyan-800 uppercase tracking-wider block">10 Mins Pax</span>
                <span className="text-lg font-extrabold text-cyan-900 font-mono">{pad(laserMetrics.pax10)}</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">20/30m Pax</span>
                <span className="text-lg font-extrabold text-emerald-900 font-mono">{pad(laserMetrics.pax20 + laserMetrics.pax30)}</span>
              </div>
            </div>

            {/* Complimentary & 30m Discount Breakdown */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600 font-medium">30 Mins Discount:</span>
                <span className="font-mono font-bold text-slate-900">{pad(laserMetrics.discountPax30)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600 font-medium">Complementary:</span>
                <span className="font-mono font-bold text-slate-900">{pad(laserMetrics.compPax)}</span>
              </div>
            </div>

            {/* Laser Editable Excess & Note */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Laser Shooter Excess
                </label>
                <input
                  type="text"
                  value={excesses.laser}
                  onChange={(e) => handleExcessChange('laser', e.target.value)}
                  placeholder="00"
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Laser Shooter Note
                </label>
                <input
                  type="text"
                  value={notes.laser}
                  onChange={(e) => handleNoteChange('laser', e.target.value)}
                  placeholder="**"
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Escape Time Section */}
          <div className="bg-white rounded-3xl p-6 border border-red-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-50 text-red-700 border border-red-200">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Escape Time Sales</h3>
                  <p className="text-xs text-slate-500 font-mono">5 Suncity Mystery Rooms</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-500">Total Sale:</span>
                <span className="ml-1 text-base font-extrabold text-red-700 font-mono">
                  ₹{(overallSale - laserMetrics.totalSale).toLocaleString()}
                </span>
              </div>
            </div>

            {/* List of 5 Mystery Games */}
            <div className="space-y-3">
              {[
                { key: 'bank_heist', name: 'Bank Heist', data: escapeMetrics.bank_heist },
                { key: 'locked_in', name: 'Locked in', data: escapeMetrics.locked_in },
                { key: 'phonebooth', name: 'Phone booth', data: escapeMetrics.phonebooth },
                { key: 'haunted_elevator', name: 'Haunted Elevator', data: escapeMetrics.haunted_elevator },
                { key: 'bunker', name: 'Bunker', data: escapeMetrics.bunker },
              ].map(({ key, name, data }) => (
                <div key={key} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      {name}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-800">
                      ₹{data.totalSale.toLocaleString()} ({data.sessions} sess / {data.totalGames} pax)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="flex justify-between bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                      <span className="text-slate-500">Discounts:</span>
                      <span className="font-mono font-bold">{pad(data.discountGames)}</span>
                    </div>
                    <div className="flex justify-between bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                      <span className="text-slate-500">Comp:</span>
                      <span className="font-mono font-bold">{pad(data.complimentary)}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200">
                      <span className="text-slate-500">Excess:</span>
                      <input
                        type="text"
                        value={excesses[key]}
                        onChange={(e) => handleExcessChange(key, e.target.value)}
                        placeholder="00"
                        className="w-10 text-center font-mono font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200">
                      <span className="text-slate-500">Note:</span>
                      <input
                        type="text"
                        value={notes[key]}
                        onChange={(e) => handleNoteChange(key, e.target.value)}
                        placeholder="**"
                        className="w-full text-slate-900 focus:outline-none text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grand Total Callout */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between shadow-lg">
            <div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Overall Net Sale ({formattedDate})
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400">
                ₹{overallSale.toLocaleString()}/-
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-mono">Prepared by:</span>
              <span className="text-sm font-bold text-amber-300">{selectedStaff}</span>
            </div>
          </div>

        </div>

        {/* Right Column: Live WhatsApp Closing Preview (5 cols) */}
        <div className="lg:col-span-5 sticky top-20 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-300 shadow-xl overflow-hidden flex flex-col">
            
            {/* WhatsApp Header Mockup */}
            <div className="bg-[#075e54] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-sm">
                  💬
                </div>
                <div>
                  <h4 className="text-xs font-extrabold tracking-wide">WhatsApp Closing Report</h4>
                  <p className="text-[10px] text-emerald-200 font-mono">{formattedDate} • Suncity</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyMessage}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-emerald-900 hover:bg-emerald-50 transition-all shadow-sm active:scale-95"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>

                <button
                  onClick={handleShareWhatsApp}
                  title="Open directly in WhatsApp"
                  className="p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Chat Bubble Container */}
            <div className="p-4 bg-[#efeae2] overflow-y-auto max-h-[620px] font-mono text-xs">
              <div className="bg-white p-4 rounded-2xl rounded-tl-sm shadow-sm border border-slate-200/80 whitespace-pre-wrap text-slate-800 leading-relaxed select-all">
                {generatedClosingMessage}
              </div>
            </div>

            {/* Bottom Action Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={handleCopyMessage}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold text-white bg-slate-900 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Message Copied to Clipboard!' : 'Copy Full Message'}</span>
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="py-2.5 px-4 rounded-xl text-xs font-extrabold text-white bg-[#25D366] hover:bg-[#20ba59] transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>Send WhatsApp</span>
              </button>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

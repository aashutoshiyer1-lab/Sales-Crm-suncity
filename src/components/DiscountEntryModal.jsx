import React, { useState, useEffect } from 'react';
import { OFFERS, REFERENCES } from '../config/venueData';
import { 
  X, 
  Camera, 
  Tag, 
  User, 
  Phone, 
  Users, 
  Percent, 
  ShieldCheck, 
  Gamepad2, 
  CheckCircle2,
  FileText,
  Sparkles
} from 'lucide-react';

export const DiscountEntryModal = ({
  isOpen,
  onClose,
  initialEntry = null,
  onSaveEntry,
  selectedDate = new Date().toISOString().split('T')[0]
}) => {
  const [offerPreset, setOfferPreset] = useState('high_price_retention');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [paxCount, setPaxCount] = useState('4');
  const [discountPercentage, setDiscountPercentage] = useState('10');
  const [gameName, setGameName] = useState('20 Mins Game');
  const [venue, setVenue] = useState('Laser Shooter');
  const [referencePerson, setReferencePerson] = useState('Rehan Sir');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const gameOptions = [
    { name: '10 Mins Game', venue: 'Laser Shooter' },
    { name: '20 Mins Game', venue: 'Laser Shooter' },
    { name: '30 Mins Game', venue: 'Laser Shooter' },
    { name: 'Bank Heist', venue: 'Escape Time' },
    { name: 'Locked In', venue: 'Escape Time' },
    { name: 'Phonebooth', venue: 'Escape Time' },
    { name: 'Haunted Elevator', venue: 'Escape Time' },
    { name: 'World War Bunker', venue: 'Escape Time' },
  ];

  // Helper to generate reason and percentage based on selected preset
  const getPresetDetails = (presetId, pCount, gName, refPerson) => {
    const playersStr = pCount ? `group of ${pCount} players` : 'group';
    const gameStr = gName ? ` for ${gName}` : '';
    const refStr = refPerson ? ` and as per ${refPerson} reference.` : '.';

    switch (presetId) {
      case 'high_price_retention':
        return {
          pct: '10',
          reason: `Given 10% discount to ${playersStr}${gameStr} as they were going back due to high prices${refStr}`
        };
      case 'birthday_package':
        return {
          pct: '10',
          reason: `Given 10% birthday package discount to ${playersStr}${gameStr}${refStr}`
        };
      case 'second_game':
        return {
          pct: '20',
          reason: `Given 20% second game discount of the day to ${playersStr}${gameStr}${refStr}`
        };
      case 'cross_promotion':
        return {
          pct: '30',
          reason: `Given 30% cross promotion coupon discount to ${playersStr}${gameStr}${refStr}`
        };
      case 'cross_promotion_brochure':
        return {
          pct: '30',
          reason: `Given 30% cross promotion brochure discount to ${playersStr}${gameStr}${refStr}`
        };
      case 'corporate_package':
        return {
          pct: '15',
          reason: `Given 15% corporate package discount to ${playersStr}${gameStr}${refStr}`
        };
      case 'complimentary':
        return {
          pct: '100',
          reason: `Complimentary game entry (Kids under 5 years)${refStr}`
        };
      case 'district_app':
        return {
          pct: '0',
          reason: 'Prepaid booking via District App.'
        };
      case 'website_booking':
        return {
          pct: '0',
          reason: 'Website booking via Razorpay.'
        };
      case 'activity_kids':
        return {
          pct: '0',
          reason: 'Activity Kids promotional booking.'
        };
      case 'custom':
      default:
        return {
          pct: '10',
          reason: ''
        };
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    if (initialEntry) {
      setCustomerName(initialEntry.customerName || '');
      setPhone(initialEntry.phone || '');
      const pCount = initialEntry.paxCount ? String(initialEntry.paxCount) : '4';
      setPaxCount(pCount);
      const pct = initialEntry.discountPercentage !== undefined ? String(initialEntry.discountPercentage) : '10';
      setDiscountPercentage(pct);
      const gName = initialEntry.gameName || '20 Mins Game';
      setGameName(gName);
      setVenue(initialEntry.venue || 'Laser Shooter');
      const ref = initialEntry.referencePerson || 'Rehan Sir';
      setReferencePerson(ref);

      const existingReason = initialEntry.customNote || initialEntry.reason || initialEntry.customDiscountReason || '';
      setReason(existingReason);

      // Detect preset id if available or inferred
      if (initialEntry.offerId && initialEntry.offerId !== 'none') {
        setOfferPreset(initialEntry.offerId);
      } else if (existingReason.toLowerCase().includes('high price') || existingReason.toLowerCase().includes('going back')) {
        setOfferPreset('high_price_retention');
      } else if (existingReason.toLowerCase().includes('birthday')) {
        setOfferPreset('birthday_package');
      } else if (existingReason.toLowerCase().includes('second game')) {
        setOfferPreset('second_game');
      } else if (existingReason.toLowerCase().includes('brochure')) {
        setOfferPreset('cross_promotion_brochure');
      } else if (existingReason.toLowerCase().includes('coupon')) {
        setOfferPreset('cross_promotion');
      } else if (existingReason.toLowerCase().includes('complimentary') || pct === '100') {
        setOfferPreset('complimentary');
      } else {
        setOfferPreset('custom');
      }
    } else {
      setCustomerName('');
      setPhone('');
      setPaxCount('4');
      setGameName('20 Mins Game');
      setVenue('Laser Shooter');
      setReferencePerson('Rehan Sir');
      setOfferPreset('high_price_retention');

      const presetDetails = getPresetDetails('high_price_retention', '4', '20 Mins Game', 'Rehan Sir');
      setDiscountPercentage(presetDetails.pct);
      setReason(presetDetails.reason);
    }
  }, [isOpen, initialEntry]);

  const handleOfferPresetChange = (presetId) => {
    setOfferPreset(presetId);
    if (presetId !== 'custom') {
      const details = getPresetDetails(presetId, paxCount, gameName, referencePerson);
      setDiscountPercentage(details.pct);
      setReason(details.reason);
    }
  };

  const handleReferenceChange = (newRef) => {
    setReferencePerson(newRef);
    if (offerPreset !== 'custom') {
      const details = getPresetDetails(offerPreset, paxCount, gameName, newRef);
      setReason(details.reason);
    }
  };

  const handleGameChange = (selectedName) => {
    setGameName(selectedName);
    const found = gameOptions.find(g => g.name === selectedName);
    if (found) {
      setVenue(found.venue);
    }
    if (offerPreset !== 'custom') {
      const details = getPresetDetails(offerPreset, paxCount, selectedName, referencePerson);
      setReason(details.reason);
    }
  };

  const handlePaxChange = (val) => {
    setPaxCount(val);
    if (offerPreset !== 'custom') {
      const details = getPresetDetails(offerPreset, val, gameName, referencePerson);
      setReason(details.reason);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please enter or select a discount reason / note.');
      return;
    }

    setSubmitting(true);
    const entryPayload = {
      ...(initialEntry || {}),
      customerName: customerName.trim(),
      phone: phone.trim(),
      paxCount: parseInt(paxCount, 10) || 1,
      discountPercentage: parseInt(discountPercentage, 10) || 0,
      gameName,
      venue,
      referencePerson,
      customNote: reason.trim(),
      reason: reason.trim(),
      customDiscountReason: reason.trim(),
      offerPreset,
      offerId: offerPreset,
      date: initialEntry?.date || selectedDate,
      isManualDiscount: !initialEntry?.isBooking
    };

    try {
      await onSaveEntry(entryPayload);
      onClose();
    } catch (err) {
      console.error('Error saving discount entry:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-50 border border-slate-300 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative my-6 overflow-hidden flex flex-col justify-between">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900">
                  {initialEntry ? (initialEntry.isBooking ? 'Edit Calendar Booking Discount' : 'Edit Shift Discount Entry') : 'Add Discount Entry'}
                </h2>
                {initialEntry?.isBooking && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
                    📅 Calendar
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-700 font-mono font-semibold">
                Shift Report • Manager Approval Record • Auto-Formatted
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-300 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5 my-3.5">
          
          {/* Preset Offer / Discount Dropdown */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Select Discount Preset
              </label>
              <span className="text-[10px] text-indigo-700 font-mono font-bold">
                Auto-fills % & Reason
              </span>
            </div>

            <select
              value={offerPreset}
              onChange={(e) => handleOfferPresetChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-xs font-extrabold text-indigo-950 bg-white border border-indigo-300 focus:border-indigo-600 focus:outline-none cursor-pointer shadow-sm"
            >
              <option value="high_price_retention">Customer Going Back Due to High Prices (10% OFF)</option>
              <option value="birthday_package">Birthday Package (10% OFF)</option>
              <option value="second_game">Second Game Special (20% OFF)</option>
              <option value="cross_promotion">Cross Promotion Coupon (30% OFF)</option>
              <option value="cross_promotion_brochure">Cross Promotion Brochure (30% OFF)</option>
              <option value="corporate_package">Corporate Package (15% OFF)</option>
              <option value="complimentary">Complimentary Game (Kids Under 5 - 100% OFF)</option>
              <option value="district_app">District Prepaid Booking</option>
              <option value="website_booking">Website Booking (Razorpay)</option>
              <option value="activity_kids">Activity Kids Booking</option>
              <option value="custom">-- Custom / Other Reason --</option>
            </select>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] font-bold text-indigo-900 uppercase">Quick chips:</span>
              {[
                { id: 'high_price_retention', label: 'High Prices (10%)' },
                { id: 'birthday_package', label: 'Birthday (10%)' },
                { id: 'second_game', label: 'Second Game (20%)' },
                { id: 'cross_promotion_brochure', label: 'Brochure (30%)' },
                { id: 'complimentary', label: 'Comp Kids (100%)' },
              ].map(chip => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => handleOfferPresetChange(chip.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                    offerPreset === chip.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white hover:bg-indigo-100 text-indigo-800 border-indigo-200'
                  }`}
                >
                  + {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reason / Note (Auto-Populated & Fully Editable) */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5 flex items-center justify-between">
              <span>Discount Reason / Staff Note <span className="text-red-600">*</span></span>
              <span className="text-[10px] text-slate-500 font-mono font-normal">Populates in Closing WhatsApp & Print Notes</span>
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                required
                rows={2}
                placeholder="e.g. Given 10% discount to group as they were going back due to high prices..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-semibold text-slate-900 bg-white border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none shadow-sm"
              />
            </div>
          </div>

          {/* Group Size & Discount % */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                Group Size (Players)
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={paxCount}
                  onChange={(e) => handlePaxChange(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-bold font-mono text-slate-900 bg-white border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                Discount Percentage (%)
              </label>
              <div className="relative">
                <Percent className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-bold font-mono text-slate-900 bg-white border border-slate-300 focus:border-indigo-600 focus:outline-none cursor-pointer"
                >
                  <option value="0">0% (Standard / Prepaid)</option>
                  <option value="10">10% OFF</option>
                  <option value="15">15% OFF</option>
                  <option value="20">20% OFF</option>
                  <option value="25">25% OFF</option>
                  <option value="30">30% OFF</option>
                  <option value="40">40% OFF</option>
                  <option value="50">50% OFF</option>
                  <option value="100">100% (Complimentary)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Room / Duration Selection */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
              Room / Game Duration
            </label>
            <div className="relative">
              <Gamepad2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <select
                value={gameName}
                onChange={(e) => handleGameChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-bold text-slate-900 bg-white border border-slate-300 focus:border-indigo-600 focus:outline-none cursor-pointer"
              >
                {gameOptions.map((g) => (
                  <option key={g.name} value={g.name}>
                    {g.name} ({g.venue})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reference Person */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
              Manager Reference
            </label>
            <div className="grid grid-cols-3 gap-2">
              {REFERENCES.map((ref) => (
                <button
                  key={ref}
                  type="button"
                  onClick={() => handleReferenceChange(ref)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold font-mono transition-all ${
                    referencePerson === ref
                      ? 'bg-indigo-600 text-white shadow-md font-extrabold'
                      : 'bg-white text-indigo-950 hover:bg-indigo-100 border border-slate-300'
                  }`}
                >
                  {ref}
                </button>
              ))}
            </div>

            {(referencePerson || '').toLowerCase().includes('khaja') && (
              <div className="mt-2 flex items-center gap-1.5 text-xs font-black text-amber-950 bg-amber-100 p-2.5 rounded-xl border border-amber-300">
                <Camera className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Attach message screenshot in closing</span>
              </div>
            )}
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Customer Name <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. Ahad"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs font-semibold text-slate-900 bg-white border border-slate-300 focus:border-indigo-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mobile Number <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. 9885109882"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 focus:border-indigo-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'Saving...' : initialEntry ? 'Update Discount' : 'Save Discount Entry'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Minus, Plus, Send } from 'lucide-react';
import { AuctionState, Participant } from '../types';
import { soundFx } from '../utils/audio';

interface AuctionTableProps {
  auction: AuctionState;
  participant: Participant | null;
  onPlaceBid: (amount: number) => void;
}

export const AuctionTable: React.FC<AuctionTableProps> = ({
  auction,
  participant,
  onPlaceBid,
}) => {
  const {
    isActive,
    isPaused,
    currentPlayer,
    currentBid,
    highestBidderName,
    secondsRemaining,
  } = auction;

  const [customBid, setCustomBid] = useState<number>(currentBid + 1);

  useEffect(() => {
    setCustomBid(currentBid + 1);
  }, [currentBid, currentPlayer?.id]);

  const handleQuickRaiseOne = () => {
    const nextBid = currentBid + 1;
    onPlaceBid(nextBid);
    soundFx.playBid();
  };

  const handleSendCustomBid = () => {
    if (customBid > currentBid) {
      onPlaceBid(customBid);
      soundFx.playBid();
    }
  };

  const incrementBid = (delta: number) => {
    setCustomBid((prev) => Math.max(currentBid + 1, prev + delta));
  };

  const roleDisplayMap: Record<
    string,
    { label: string; bg: string; text: string; border: string }
  > = {
    P: { label: 'P · PORTIERE', bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/30' },
    D: { label: 'D · DIFENSORE', bg: 'bg-cyan-500/15', text: 'text-cyan-300', border: 'border-cyan-500/30' },
    C: { label: 'C · CENTROCAMPISTA', bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30' },
    A: { label: 'A · ATTACCANTE', bg: 'bg-rose-500/15', text: 'text-rose-300', border: 'border-rose-500/30' },
  };

  const roleInfo = roleDisplayMap[currentPlayer?.role] || roleDisplayMap.C;

  return (
    <section className="w-full p-4 bg-slate-900 rounded-lg border border-slate-700">
      {/* Chiamata Section */}
      <div className="mb-4">
        <input
          type="number"
          defaultValue={1}
          className="w-20 py-1 px-2 mr-2 bg-slate-800 border border-slate-700 rounded"
        />
        <button className="bg-blue-600 text-white py-1 px-4 rounded">
          Chiama 📣
        </button>
      </div>

      {/* Player Card Header */}
      <div className="text-center mb-4">
        <div className={`px-3 py-1 text-xs font-black rounded-full border ${roleInfo.bg} ${roleInfo.text} ${roleInfo.border}`}>
          {roleInfo.label} &bull; {currentPlayer?.team}
        </div>
        <h2 className="text-3xl font-black text-white mt-2">
          {currentPlayer?.name}
        </h2>
      </div>

      {/* Timer & Progress Bar */}
      <div className="mb-4">
        <span className="text-emerald-400">{secondsRemaining}s</span>
        <div className="h-2 bg-slate-800 rounded-full">
          <div className="h-2 bg-emerald-500" style={{ width: `${(secondsRemaining / 14) * 100}%` }} />
        </div>
      </div>

      {/* Current Bid Section */}
      <div className="text-center mb-4">
        <span className="text-slate-400 uppercase">Offerta Attuale:</span>
        <div className="text-6xl font-black text-emerald-400">
          {currentBid}
        </div>
        <span className="text-slate-400">In testa: {highestBidderName}</span>
      </div>

      {/* Primary Action */}
      <button
        onClick={handleQuickRaiseOne}
        disabled={isPaused}
        className="w-full py-3 bg-emerald-600 text-white font-black rounded mb-2"
      >
        RILANCIA +1
      </button>

      {/* Custom Bid Controls */}
      <div className="flex items-center gap-2">
        <button onClick={() => incrementBid(-1)} className="p-2 bg-slate-800 rounded">
          <Minus className="w-5 h-5" />
        </button>
        <input
          type="number"
          value={customBid}
          onChange={(e) => setCustomBid(parseInt(e.target.value, 10) || currentBid + 1)}
          className="w-20 py-1 px-2 bg-slate-800 border border-slate-700 rounded text-center"
        />
        <button onClick={() => incrementBid(1)} className="p-2 bg-slate-800 rounded">
          <Plus className="w-5 h-5" />
        </button>
        <button
          onClick={handleSendCustomBid}
          disabled={isPaused}
          className="p-2 bg-blue-600 text-white rounded"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
};
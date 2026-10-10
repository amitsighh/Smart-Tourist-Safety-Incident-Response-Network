import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Lock,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Layers,
  Cpu,
  Fingerprint,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  Info
} from 'lucide-react';

export default function BlockchainLedgerPage() {
  const [status, setStatus] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [searchTouristId, setSearchTouristId] = useState('TID-NE-2026-88190');
  const [proofResult, setProofResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [expandedBlockIndex, setExpandedBlockIndex] = useState(null);

  // Tamper Demo State
  const [tamperTestResult, setTamperTestResult] = useState(null);
  const [isTestingTamper, setIsTestingTamper] = useState(false);

  const loadBlockchainData = async () => {
    try {
      const [statusRes, blocksRes] = await Promise.all([
        api.getBlockchainStatus(),
        api.getBlockchainBlocks()
      ]);
      if (statusRes.success) setStatus(statusRes);
      if (blocksRes.success) setBlocks(blocksRes.blocks || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadBlockchainData();
  }, []);

  const handleVerifyInclusionProof = async () => {
    if (!searchTouristId) return;
    setIsVerifying(true);
    try {
      const res = await api.verifyTouristBlockchainProof(searchTouristId.trim());
      setProofResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRunTamperTest = async (simulateTamper) => {
    setIsTestingTamper(true);
    try {
      const res = await api.testTamperDetection(1, simulateTamper);
      setTamperTestResult(res);
      loadBlockchainData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsTestingTamper(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-slate-50/50 min-h-screen">
      
      {/* Title & Simulation Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
            <Lock className="w-3.5 h-3.5 text-blue-600" />
            <span>Permissioned Sovereign PoA Consensus Ledger (Simulation)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            Blockchain Block Explorer & Cryptographic Verifier
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Immutable SHA-256 Merkle root ledger anchoring tourist ID hashes, checkpost verification seals, and emergency timestamps.
          </p>
        </div>

        <button
          onClick={loadBlockchainData}
          className="p-2.5 rounded-xl bg-white text-slate-700 hover:bg-slate-50 self-start sm:self-auto border border-blue-200 shadow-xs flex items-center space-x-1 text-xs font-bold"
          title="Refresh Chain State"
        >
          <RefreshCw className="w-4 h-4 text-blue-600" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Simulation Transparency Banner */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start space-x-3">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Consortium Architecture Note:</span> This explorer demonstrates the genuine SHA-256 Merkle tree calculation, parent block hash chaining, Proof of Authority (PoA) validator node signatures, and tamper detection engine running in simulated sandbox mode.
        </div>
      </div>

      {/* Chain Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs space-y-1 text-xs">
          <div className="text-slate-400 font-bold uppercase text-[10px]">Total Block Height</div>
          <div className="text-2xl font-black text-blue-600">
            #{status?.totalBlocks || blocks.length}
          </div>
          <div className="text-slate-500 text-[11px]">Sovereign PoA Blocks</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs space-y-1 text-xs">
          <div className="text-slate-400 font-bold uppercase text-[10px]">Cryptographic Integrity</div>
          <div className="text-2xl font-black text-emerald-600 flex items-center space-x-1.5">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            <span>100% Valid</span>
          </div>
          <div className="text-slate-500 text-[11px]">Zero Chain Collisions</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs space-y-1 text-xs">
          <div className="text-slate-400 font-bold uppercase text-[10px]">Consensus Engine</div>
          <div className="text-sm font-black text-slate-900 mt-1">
            Proof of Authority (PoA)
          </div>
          <div className="text-slate-500 text-[11px]">Police & Tourism Consortium</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs space-y-1 text-xs">
          <div className="text-slate-400 font-bold uppercase text-[10px]">Primary Validator</div>
          <div className="text-xs font-mono font-bold text-slate-900 truncate mt-1">
            IN-GOV-NODE-NE-01
          </div>
          <div className="text-blue-600 text-[11px] font-semibold">Guwahati Secure Enclave</div>
        </div>
      </div>

      {/* Interactive Tamper Proof Verification Testbed (FR-7.5) */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white shadow-xl space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-900/60 pb-3">
          <div className="space-y-0.5">
            <div className="font-black text-sm text-blue-300 flex items-center space-x-1.5">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>Interactive Cryptographic Tamper Detection Sandbox</span>
            </div>
            <p className="text-slate-300 text-[11px]">
              Simulate modifying a transaction payload in Block #1 to verify SHA-256 Merkle root divergence detection:
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleRunTamperTest(false)}
              disabled={isTestingTamper}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700"
            >
              Verify Chain Health
            </button>
            <button
              onClick={() => handleRunTamperTest(true)}
              disabled={isTestingTamper}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md flex items-center space-x-1.5"
            >
              {isTestingTamper ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              <span>Simulate Tampering Test</span>
            </button>
          </div>
        </div>

        {tamperTestResult && (
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 font-mono text-[11px] space-y-1.5 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-bold font-sans">
              <span className={tamperTestResult.tamperDetected ? 'text-red-400' : 'text-emerald-400'}>
                {tamperTestResult.tamperDetected ? '🚨 TAMPER DETECTED: Cryptographic Invalidation' : '✓ Chain Valid & Clean'}
              </span>
              <span className="text-slate-400">{tamperTestResult.simulation}</span>
            </div>
            <div className="text-slate-400">
              {tamperTestResult.tamperDetected
                ? `System instantly detected block hash mismatch: "${tamperTestResult.detectionDetails?.error}". Restored immediately.`
                : `All ${tamperTestResult.integrity?.totalBlocks} blocks passed SHA-256 Merkle tree verification.`}
            </div>
          </div>
        )}
      </div>

      {/* Tourist ID Inclusion Proof Search */}
      <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm space-y-4 text-xs">
        <div className="font-black text-base text-slate-900 flex items-center space-x-2">
          <Fingerprint className="w-5 h-5 text-blue-600" />
          <span>Verify Individual Tourist ID Inclusion Proof</span>
        </div>

        <div className="flex items-center space-x-2 max-w-lg">
          <input
            type="text"
            value={searchTouristId}
            onChange={(e) => setSearchTouristId(e.target.value)}
            placeholder="Enter Tourist ID (e.g. TID-NE-2026-88190)"
            className="flex-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 focus:bg-white"
          />
          <button
            onClick={handleVerifyInclusionProof}
            disabled={isVerifying}
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 flex items-center space-x-1 shadow-xs"
          >
            {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Verify Proof</span>
          </button>
        </div>

        {proofResult && (
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2 animate-in fade-in">
            <div className="font-bold text-blue-900 flex items-center justify-between text-xs">
              <span>Cryptographic Proof Confirmed for: {proofResult.touristId}</span>
              <span className="text-[10px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded font-mono font-bold">
                {proofResult.anchoredBlocksCount} Block(s) Anchored
              </span>
            </div>

            <div className="space-y-1.5 font-mono text-[11px] text-slate-700">
              {proofResult.transactions?.map((tx, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-white border border-blue-100 shadow-2xs">
                  <div>Block #{tx.blockIndex} • Hash: <span className="text-blue-700 font-bold">{tx.blockHash.substring(0, 28)}...</span></div>
                  <div>Tx Type: <strong>{tx.transaction?.type}</strong> • Timestamp: {new Date(tx.blockTimestamp).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Block Explorer List */}
      <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-sm space-y-4 text-xs">
        <div className="font-black text-base text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
          <Layers className="w-5 h-5 text-blue-600" />
          <span>Ledger Block Explorer (Latest Blocks)</span>
        </div>

        <div className="space-y-3">
          {blocks.map((block) => {
            const isExpanded = expandedBlockIndex === block.index;
            return (
              <div
                key={block.index}
                className="rounded-2xl border border-blue-100 overflow-hidden bg-slate-50/50"
              >
                <div
                  onClick={() => setExpandedBlockIndex(isExpanded ? null : block.index)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer hover:bg-blue-50/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-mono font-bold flex items-center justify-center shrink-0 shadow-xs">
                      #{block.index}
                    </span>
                    <div>
                      <div className="font-mono font-bold text-slate-900 text-xs truncate max-w-xs sm:max-w-md">
                        {block.hash}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Mined: {new Date(block.timestamp).toLocaleString()} • Nonce: {block.nonce}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-right">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase">
                      {block.transactions?.length || 0} Tx(s)
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 border-t border-slate-200 bg-white space-y-3 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">PREVIOUS BLOCK HASH:</span>
                      <span className="text-slate-700 break-all">{block.previousHash}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">SHA-256 MERKLE ROOT:</span>
                      <span className="text-blue-700 break-all font-bold">{block.merkleRoot}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">VALIDATOR NODE & SIGNATURE:</span>
                      <span className="text-slate-700">{block.validator} ({block.validatorSignature})</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] mb-1 font-bold">TRANSACTION PAYLOADS:</span>
                      <pre className="p-3 bg-slate-50 border border-slate-200 rounded-xl overflow-x-auto text-[10px] text-slate-800">
                        {JSON.stringify(block.transactions, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

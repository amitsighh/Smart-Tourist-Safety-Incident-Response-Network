import { blockchainLedger } from '../services/blockchainLedger.js';
import { recordAuditDirect } from '../middleware/auditLogger.js';

export const blockchainController = {
  // Get Blockchain Status & Verify Cryptographic Integrity (FR-1.4, FR-7.5)
  async getStatus(req, res) {
    try {
      const integrity = blockchainLedger.validateChainIntegrity();
      const latestBlock = blockchainLedger.getLatestBlock();

      return res.json({
        success: true,
        network: 'SurakshaYatra Sovereign Permissioned Ledger',
        consensus: 'Proof of Authority (PoA) - State Police & Tourism Consensus',
        validatorNode: blockchainLedger.validatorNode,
        totalBlocks: blockchainLedger.chain.length,
        latestBlockIndex: latestBlock.index,
        latestBlockHash: latestBlock.hash,
        latestBlockTimestamp: latestBlock.timestamp,
        integrity
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to verify blockchain integrity.' });
    }
  },

  // Get All Blocks for Block Explorer UI
  async getAllBlocks(req, res) {
    try {
      return res.json({
        success: true,
        totalBlocks: blockchainLedger.chain.length,
        blocks: [...blockchainLedger.chain].reverse() // latest first
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve blocks.' });
    }
  },

  // Get Single Block Details
  async getBlockByIndex(req, res) {
    try {
      const index = parseInt(req.params.index, 10);
      const block = blockchainLedger.chain.find(b => b.index === index);

      if (!block) {
        return res.status(404).json({ success: false, message: `Block #${index} not found.` });
      }

      return res.json({ success: true, block });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve block.' });
    }
  },

  // Verify Tourist ID Inclusion Proof
  async verifyTouristIdProof(req, res) {
    try {
      const { touristId } = req.params;
      const history = blockchainLedger.findTransactionByTouristId(touristId);

      if (history.length === 0) {
        return res.status(404).json({
          success: false,
          isAnchored: false,
          message: `No cryptographic blockchain anchor found for Tourist ID: ${touristId}`
        });
      }

      return res.json({
        success: true,
        isAnchored: true,
        touristId,
        anchoredBlocksCount: history.length,
        transactions: history,
        verifiedBy: blockchainLedger.validatorNode
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to verify inclusion proof.' });
    }
  },

  // Simulate Tampering Attempt & Demonstrate Cryptographic Tamper Detection
  async testTamperDetection(req, res) {
    try {
      const { blockIndex = 1, simulateMaliciousEdit = false } = req.body;

      if (simulateMaliciousEdit && blockchainLedger.chain[blockIndex]) {
        // Create an intentional perturbation to show detection
        const originalTx = JSON.stringify(blockchainLedger.chain[blockIndex].transactions);
        blockchainLedger.chain[blockIndex].transactions[0].tampered = true;
        const checkAfterTamper = blockchainLedger.validateChainIntegrity();

        // Restore immediately after test
        blockchainLedger.chain[blockIndex].transactions = JSON.parse(originalTx);

        return res.json({
          success: true,
          simulation: 'ACTIVE_TAMPER_TEST',
          tamperDetected: !checkAfterTamper.valid,
          detectionDetails: checkAfterTamper,
          restoredStatus: 'CLEAN'
        });
      }

      const integrity = blockchainLedger.validateChainIntegrity();
      return res.json({
        success: true,
        simulation: 'HEALTH_CHECK',
        tamperDetected: !integrity.valid,
        integrity
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Tamper test execution failed.' });
    }
  }
};

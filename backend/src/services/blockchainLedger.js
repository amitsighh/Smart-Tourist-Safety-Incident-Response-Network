import crypto from 'crypto';

class BlockchainLedger {
  constructor() {
    this.chain = [];
    this.pendingTransactions = [];
    this.difficulty = 2; // PoA / fast consensus simulation for demo
    this.validatorNode = 'IN-GOV-NODE-NE-01 (Guwahati Secure Enclave)';
    this.initializeGenesisBlock();
  }

  calculateHash(index, previousHash, timestamp, merkleRoot, transactions, nonce) {
    const rawData = `${index}-${previousHash}-${timestamp}-${merkleRoot}-${JSON.stringify(transactions)}-${nonce}`;
    return crypto.createHash('sha256').update(rawData).digest('hex');
  }

  buildMerkleRoot(transactions) {
    if (!transactions || transactions.length === 0) {
      return crypto.createHash('sha256').update('EMPTY_MERKLE_ROOT').digest('hex');
    }

    let hashes = transactions.map(tx =>
      crypto.createHash('sha256').update(typeof tx === 'string' ? tx : JSON.stringify(tx)).digest('hex')
    );

    while (hashes.length > 1) {
      if (hashes.length % 2 !== 0) {
        hashes.push(hashes[hashes.length - 1]); // duplicate last if odd
      }
      const nextLevel = [];
      for (let i = 0; i < hashes.length; i += 2) {
        const combined = crypto.createHash('sha256').update(hashes[i] + hashes[i + 1]).digest('hex');
        nextLevel.push(combined);
      }
      hashes = nextLevel;
    }

    return hashes[0];
  }

  initializeGenesisBlock() {
    const timestamp = '2026-10-01T00:00:00.000Z';
    const genesisTxs = [
      {
        type: 'GENESIS',
        network: 'SurakshaYatra Sovereign Permissioned Ledger',
        governance: 'Ministry of Tourism & State Police Consortium',
        initialValidator: this.validatorNode
      }
    ];
    const merkleRoot = this.buildMerkleRoot(genesisTxs);
    const genesisHash = this.calculateHash(0, '0'.repeat(64), timestamp, merkleRoot, genesisTxs, 0);

    const genesisBlock = {
      index: 0,
      timestamp,
      previousHash: '0'.repeat(64),
      merkleRoot,
      transactions: genesisTxs,
      nonce: 0,
      validator: this.validatorNode,
      validatorSignature: 'SIG-GENESIS-ED25519-AUTH-9901-PROV',
      hash: genesisHash
    };

    this.chain.push(genesisBlock);
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  recordDigitalIdIssuance(touristIdData) {
    const tx = {
      txId: 'TX-' + crypto.randomBytes(8).toString('hex').toUpperCase(),
      type: 'DIGITAL_ID_ISSUANCE',
      touristId: touristIdData.touristId,
      idHash: crypto.createHash('sha256').update(JSON.stringify(touristIdData)).digest('hex'),
      validFrom: touristIdData.validFrom,
      validUntil: touristIdData.validUntil,
      kycType: touristIdData.kycType,
      kycVerificationHash: touristIdData.kycHash,
      itineraryHash: crypto.createHash('sha256').update(JSON.stringify(touristIdData.itinerary || [])).digest('hex'),
      issuingOfficer: touristIdData.issuedBy || 'ONLINE_SELF_REGISTRATION',
      timestamp: new Date().toISOString()
    };

    return this.mineBlock([tx]);
  }

  recordItineraryUpdate(touristId, itinerary, updatedBy) {
    const tx = {
      txId: 'TX-' + crypto.randomBytes(8).toString('hex').toUpperCase(),
      type: 'ITINERARY_UPDATE',
      touristId,
      itineraryHash: crypto.createHash('sha256').update(JSON.stringify(itinerary)).digest('hex'),
      updatedBy: updatedBy || 'TOURIST_APP',
      timestamp: new Date().toISOString()
    };

    return this.mineBlock([tx]);
  }

  recordEmergencyIncident(incidentData) {
    const tx = {
      txId: 'TX-' + crypto.randomBytes(8).toString('hex').toUpperCase(),
      type: 'EMERGENCY_INCIDENT_ANCHOR',
      incidentId: incidentData.id,
      touristId: incidentData.touristId,
      incidentType: incidentData.type,
      locationHash: crypto.createHash('sha256').update(`${incidentData.latitude},${incidentData.longitude}`).digest('hex'),
      timestamp: incidentData.timestamp || new Date().toISOString()
    };

    return this.mineBlock([tx]);
  }

  mineBlock(transactions) {
    const previousBlock = this.getLatestBlock();
    const index = previousBlock.index + 1;
    const timestamp = new Date().toISOString();
    const merkleRoot = this.buildMerkleRoot(transactions);

    let nonce = 0;
    let hash = this.calculateHash(index, previousBlock.hash, timestamp, merkleRoot, transactions, nonce);

    // Light proof-of-authority nonce resolution
    while (!hash.startsWith('0'.repeat(this.difficulty))) {
      nonce++;
      hash = this.calculateHash(index, previousBlock.hash, timestamp, merkleRoot, transactions, nonce);
    }

    const newBlock = {
      index,
      timestamp,
      previousHash: previousBlock.hash,
      merkleRoot,
      transactions,
      nonce,
      validator: this.validatorNode,
      validatorSignature: 'SIG-' + crypto.randomBytes(16).toString('hex').toUpperCase(),
      hash
    };

    this.chain.push(newBlock);
    return newBlock;
  }

  validateChainIntegrity() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // 1. Verify previous hash link
      if (currentBlock.previousHash !== previousBlock.hash) {
        return {
          valid: false,
          error: `Broken link at block #${currentBlock.index}: previousHash mismatch`,
          corruptedBlockIndex: currentBlock.index
        };
      }

      // 2. Verify Merkle root
      const calculatedMerkle = this.buildMerkleRoot(currentBlock.transactions);
      if (currentBlock.merkleRoot !== calculatedMerkle) {
        return {
          valid: false,
          error: `Merkle root tampered at block #${currentBlock.index}`,
          corruptedBlockIndex: currentBlock.index
        };
      }

      // 3. Verify block hash
      const recalculatedHash = this.calculateHash(
        currentBlock.index,
        currentBlock.previousHash,
        currentBlock.timestamp,
        currentBlock.merkleRoot,
        currentBlock.transactions,
        currentBlock.nonce
      );

      if (currentBlock.hash !== recalculatedHash) {
        return {
          valid: false,
          error: `Block hash tampered at block #${currentBlock.index}`,
          corruptedBlockIndex: currentBlock.index
        };
      }
    }

    return {
      valid: true,
      totalBlocks: this.chain.length,
      latestBlockHash: this.getLatestBlock().hash,
      lastValidated: new Date().toISOString()
    };
  }

  verifyChain() {
    return this.validateChainIntegrity();
  }

  findTransactionByTouristId(touristId) {
    const matched = [];
    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.touristId === touristId) {
          matched.push({
            blockIndex: block.index,
            blockHash: block.hash,
            blockTimestamp: block.timestamp,
            validator: block.validator,
            transaction: tx
          });
        }
      }
    }
    return matched;
  }
}

export const blockchainLedger = new BlockchainLedger();

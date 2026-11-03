const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function getStoreFilePath(dbName) {
  const custom = process.env.MONGO_STORE_FILE;
  if (custom) return custom;
  let curr = __dirname;
  let rootDir = path.resolve(__dirname, '../../../..');
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(curr, 'package.json'))) {
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(curr, 'package.json'), 'utf8'));
        if (pkg.workspaces) {
          rootDir = curr;
          break;
        }
      } catch (e) {}
    }
    const parent = path.dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }
  const dataDir = path.join(rootDir, '.data');
  return path.join(dataDir, `mongo-store-${dbName}.json`);
}

function generateObjectId() {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const randomBytes = crypto.randomBytes(8).toString('hex');
  return timestamp + randomBytes;
}

function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;
  if (!path.includes('.')) return obj[path];
  const parts = path.split('.');
  let curr = obj;
  for (const part of parts) {
    if (curr === null || curr === undefined) return undefined;
    curr = curr[part];
  }
  return curr;
}

function setNestedValue(obj, path, value) {
  const parts = path.split('.');
  let curr = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!curr[part] || typeof curr[part] !== 'object') {
      curr[part] = {};
    }
    curr = curr[part];
  }
  curr[parts[parts.length - 1]] = value;
}

function matchesCondition(docValue, cond) {
  if (cond === undefined) return true;
  if (cond instanceof RegExp) {
    return cond.test(String(docValue ?? ''));
  }
  if (cond !== null && typeof cond === 'object' && !Array.isArray(cond)) {
    for (const op of Object.keys(cond)) {
      const opVal = cond[op];
      switch (op) {
        case '$eq':
          if (docValue !== opVal) return false;
          break;
        case '$ne':
          if (docValue === opVal) return false;
          break;
        case '$in':
          if (!Array.isArray(opVal) || !opVal.includes(docValue)) return false;
          break;
        case '$nin':
          if (Array.isArray(opVal) && opVal.includes(docValue)) return false;
          break;
        case '$regex':
          const rx = new RegExp(opVal, cond.$options || 'i');
          if (!rx.test(String(docValue ?? ''))) return false;
          break;
        case '$gt':
          if (!(docValue > opVal)) return false;
          break;
        case '$gte':
          if (!(docValue >= opVal)) return false;
          break;
        case '$lt':
          if (!(docValue < opVal)) return false;
          break;
        case '$lte':
          if (!(docValue <= opVal)) return false;
          break;
        case '$exists':
          if (opVal && docValue === undefined) return false;
          if (!opVal && docValue !== undefined) return false;
          break;
      }
    }
    return true;
  }
  return docValue === cond;
}

function matchesQuery(doc, query = {}) {
  if (!query || Object.keys(query).length === 0) return true;

  if (query.$or && Array.isArray(query.$or)) {
    const orMatch = query.$or.some((q) => matchesQuery(doc, q));
    if (!orMatch) return false;
  }

  if (query.$and && Array.isArray(query.$and)) {
    const andMatch = query.$and.every((q) => matchesQuery(doc, q));
    if (!andMatch) return false;
  }

  for (const key of Object.keys(query)) {
    if (key === '$or' || key === '$and') continue;
    const docVal = getNestedValue(doc, key);
    const cond = query[key];
    if (!matchesCondition(docVal, cond)) {
      return false;
    }
  }

  return true;
}

function applyProjection(doc, projection) {
  if (!projection || Object.keys(projection).length === 0) {
    return JSON.parse(JSON.stringify(doc));
  }
  const cloned = JSON.parse(JSON.stringify(doc));
  const isInclusive = Object.values(projection).some((v) => v === 1 || v === true);

  if (isInclusive) {
    const result = { _id: cloned._id };
    for (const [k, v] of Object.entries(projection)) {
      if (v === 1 || v === true) {
        setNestedValue(result, k, getNestedValue(cloned, k));
      } else if (k === '_id' && (v === 0 || v === false)) {
        delete result._id;
      }
    }
    return result;
  } else {
    // Exclusive projection
    for (const [k, v] of Object.entries(projection)) {
      if (v === 0 || v === false) {
        const parts = k.split('.');
        let curr = cloned;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!curr[parts[i]]) break;
          curr = curr[parts[i]];
        }
        if (curr && typeof curr === 'object') {
          delete curr[parts[parts.length - 1]];
        }
      }
    }
    return cloned;
  }
}

class MongoCursor {
  constructor(collection, query = {}, options = {}) {
    this.collection = collection;
    this.query = query;
    this.projectionObj = options.projection || null;
    this.sortObj = null;
    this.skipCount = 0;
    this.limitCount = 0;
  }

  project(proj) {
    this.projectionObj = proj;
    return this;
  }

  sort(sortCriteria) {
    this.sortObj = sortCriteria;
    return this;
  }

  skip(n) {
    this.skipCount = Math.max(0, parseInt(n, 10) || 0);
    return this;
  }

  limit(n) {
    this.limitCount = Math.max(0, parseInt(n, 10) || 0);
    return this;
  }

  async toArray() {
    let docs = this.collection._documents.filter((d) => matchesQuery(d, this.query));

    if (this.sortObj && Object.keys(this.sortObj).length > 0) {
      docs.sort((a, b) => {
        for (const [field, direction] of Object.entries(this.sortObj)) {
          const valA = getNestedValue(a, field);
          const valB = getNestedValue(b, field);
          const dir = direction === -1 || direction === 'desc' ? -1 : 1;

          if (valA === valB) continue;
          if (valA === undefined || valA === null) return 1 * dir;
          if (valB === undefined || valB === null) return -1 * dir;
          if (valA < valB) return -1 * dir;
          if (valA > valB) return 1 * dir;
        }
        return 0;
      });
    }

    if (this.skipCount > 0) {
      docs = docs.slice(this.skipCount);
    }
    if (this.limitCount > 0) {
      docs = docs.slice(0, this.limitCount);
    }

    return docs.map((d) => applyProjection(d, this.projectionObj));
  }
}

class SimulatedCollection {
  constructor(name, database) {
    this.name = name;
    this.database = database;
    this._documents = [];
    this._indexes = [{ name: '_id_', key: { _id: 1 }, unique: true }];
  }

  async createIndex(keys, options = {}) {
    const name = options.name || Object.entries(keys).map(([k, v]) => `${k}_${v}`).join('_');
    const existing = this._indexes.find((idx) => idx.name === name);
    if (!existing) {
      this._indexes.push({ name, key: keys, ...options });
    }
    return name;
  }

  async getIndexes() {
    return this._indexes;
  }

  find(query = {}, options = {}) {
    if (this.database._loadFromFile) this.database._loadFromFile();
    return new MongoCursor(this, query, options);
  }

  async findOne(query = {}, options = {}) {
    if (this.database._loadFromFile) this.database._loadFromFile();
    const docs = await this.find(query, options).limit(1).toArray();
    return docs[0] || null;
  }

  async insertOne(doc) {
    if (this.database._loadFromFile) this.database._loadFromFile();
    const cloned = JSON.parse(JSON.stringify(doc));
    if (!cloned._id) {
      cloned._id = generateObjectId();
    }
    this._documents.push(cloned);
    if (this.database._saveToFile) this.database._saveToFile();
    return {
      acknowledged: true,
      insertedId: cloned._id
    };
  }

  async insertMany(docs) {
    if (this.database._loadFromFile) this.database._loadFromFile();
    const insertedIds = {};
    const clonedDocs = docs.map((d, index) => {
      const cloned = JSON.parse(JSON.stringify(d));
      if (!cloned._id) {
        cloned._id = generateObjectId();
      }
      insertedIds[index] = cloned._id;
      return cloned;
    });
    this._documents.push(...clonedDocs);
    if (this.database._saveToFile) this.database._saveToFile();
    return {
      acknowledged: true,
      insertedCount: clonedDocs.length,
      insertedIds
    };
  }

  async updateOne(query, update = {}, options = {}) {
    if (this.database._loadFromFile) this.database._loadFromFile();
    const doc = this._documents.find((d) => matchesQuery(d, query));
    if (!doc) {
      if (options.upsert) {
        const newDoc = { _id: generateObjectId() };
        if (update.$set) {
          for (const [k, v] of Object.entries(update.$set)) {
            setNestedValue(newDoc, k, v);
          }
        }
        this._documents.push(newDoc);
        if (this.database._saveToFile) this.database._saveToFile();
        return { acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedId: newDoc._id };
      }
      return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
    }

    if (update.$set) {
      for (const [k, v] of Object.entries(update.$set)) {
        setNestedValue(doc, k, v);
      }
    }
    if (update.$unset) {
      for (const k of Object.keys(update.$unset)) {
        const parts = k.split('.');
        let curr = doc;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!curr[parts[i]]) break;
          curr = curr[parts[i]];
        }
        if (curr && typeof curr === 'object') {
          delete curr[parts[parts.length - 1]];
        }
      }
    }

    if (this.database._saveToFile) this.database._saveToFile();
    return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
  }

  async updateMany(query, update = {}) {
    if (this.database._loadFromFile) this.database._loadFromFile();
    const matches = this._documents.filter((d) => matchesQuery(d, query));
    for (const doc of matches) {
      if (update.$set) {
        for (const [k, v] of Object.entries(update.$set)) {
          setNestedValue(doc, k, v);
        }
      }
      if (update.$unset) {
        for (const k of Object.keys(update.$unset)) {
          const parts = k.split('.');
          let curr = doc;
          for (let i = 0; i < parts.length - 1; i++) {
            if (!curr[parts[i]]) break;
            curr = curr[parts[i]];
          }
          if (curr && typeof curr === 'object') {
            delete curr[parts[parts.length - 1]];
          }
        }
      }
    }
    if (this.database._saveToFile) this.database._saveToFile();
    return { acknowledged: true, matchedCount: matches.length, modifiedCount: matches.length };
  }

  async deleteOne(query) {
    if (this.database._loadFromFile) this.database._loadFromFile();
    const index = this._documents.findIndex((d) => matchesQuery(d, query));
    if (index !== -1) {
      this._documents.splice(index, 1);
      if (this.database._saveToFile) this.database._saveToFile();
      return { acknowledged: true, deletedCount: 1 };
    }
    return { acknowledged: true, deletedCount: 0 };
  }

  async deleteMany(query = {}) {
    if (this.database._loadFromFile) this.database._loadFromFile();
    const initialLen = this._documents.length;
    this._documents = this._documents.filter((d) => !matchesQuery(d, query));
    const deletedCount = initialLen - this._documents.length;
    if (this.database._saveToFile) this.database._saveToFile();
    return { acknowledged: true, deletedCount };
  }

  async countDocuments(query = {}) {
    if (this.database._loadFromFile) this.database._loadFromFile();
    return this._documents.filter((d) => matchesQuery(d, query)).length;
  }
}

class SimulatedMongoDatabase {
  constructor(dbName = 'mental_health_assessment', options = {}) {
    this.databaseName = dbName;
    this.collections = new Map();
    this.isSimulated = true;
    this.connected = true;
    this.storeFilePath = getStoreFilePath(dbName);
    this._lastFileMtime = 0;
    this.persistToFile = options.persistToFile !== undefined ? options.persistToFile : true;

    // Pre-initialize collections
    this.collection('assessment_attempts');
    this.collection('admin_users');
    this.collection('admin_sessions');
    this.collection('audit_logs');
    this.collection('admin_resets');

    if (this.persistToFile) {
      this._loadFromFile();
    }

    // Create schema indexes
    this.collection('assessment_attempts').createIndex({ attemptId: 1 }, { unique: true });
    this.collection('assessment_attempts').createIndex({ employeeId: 1, status: 1 });
    this.collection('assessment_attempts').createIndex({ submittedAt: -1 });
    this.collection('assessment_attempts').createIndex({ 'snapshot.department': 1, 'snapshot.company': 1 });

    this.collection('admin_users').createIndex({ username: 1 }, { unique: true });
    this.collection('admin_sessions').createIndex({ sessionToken: 1 }, { unique: true });
    this.collection('admin_sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    this.collection('audit_logs').createIndex({ timestamp: -1 });
    this.collection('audit_logs').createIndex({ action: 1, actor: 1 });
  }

  _loadFromFile() {
    if (!this.persistToFile) return;
    try {
      if (!fs.existsSync(this.storeFilePath)) return;
      const stat = fs.statSync(this.storeFilePath);
      if (stat.mtimeMs <= this._lastFileMtime) return;
      const content = fs.readFileSync(this.storeFilePath, 'utf8');
      if (!content.trim()) return;
      const data = JSON.parse(content);
      this._lastFileMtime = stat.mtimeMs;
      for (const [name, docs] of Object.entries(data)) {
        const col = this.collection(name);
        col._documents = Array.isArray(docs) ? docs : [];
      }
    } catch (e) {
      // ignore
    }
  }

  _saveToFile() {
    if (!this.persistToFile) return;
    try {
      const dataDir = path.dirname(this.storeFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const data = {};
      for (const [name, col] of this.collections.entries()) {
        data[name] = col._documents;
      }
      fs.writeFileSync(this.storeFilePath, JSON.stringify(data, null, 2), 'utf8');
      const stat = fs.statSync(this.storeFilePath);
      this._lastFileMtime = stat.mtimeMs;
    } catch (e) {
      console.error('[SimulatedMongo] Failed to save to file:', e.message);
    }
  }

  collection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new SimulatedCollection(name, this));
    }
    return this.collections.get(name);
  }

  async command(cmd = {}) {
    if (cmd.ping !== undefined) {
      return { ok: 1 };
    }
    return { ok: 1 };
  }

  async listCollections() {
    return Array.from(this.collections.keys()).map((name) => ({ name, type: 'collection' }));
  }

  async getOverview() {
    if (this._loadFromFile) this._loadFromFile();
    const overview = {
      database: this.databaseName,
      type: 'MongoDB Document Store (Simulated In-Memory with File Store)',
      status: 'connected',
      collectionsCount: this.collections.size,
      collections: {}
    };

    for (const [name, col] of this.collections.entries()) {
      overview.collections[name] = {
        documentCount: col._documents.length,
        indexes: col._indexes.map((idx) => ({ name: idx.name, key: idx.key, unique: !!idx.unique }))
      };
    }

    return overview;
  }
}

let activeDatabase = null;

function getMongoDatabase(dbName = 'mental_health_assessment') {
  if (!activeDatabase) {
    activeDatabase = new SimulatedMongoDatabase(dbName);
  }
  return activeDatabase;
}

function resetMongoDatabase(dbName = 'mental_health_assessment') {
  const storePath = getStoreFilePath(dbName);
  try {
    if (fs.existsSync(storePath)) {
      fs.unlinkSync(storePath);
    }
  } catch (e) {}
  activeDatabase = new SimulatedMongoDatabase(dbName);
  return activeDatabase;
}

module.exports = {
  getMongoDatabase,
  resetMongoDatabase,
  SimulatedMongoDatabase,
  SimulatedCollection,
  generateObjectId
};

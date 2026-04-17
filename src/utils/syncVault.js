const CONFIG_KEY = 'assistenteFinanceiroSyncConfig';
const META_KEY = 'assistenteFinanceiroSyncMeta';
const DEVICE_KEY = 'assistenteFinanceiroSyncDevice';
const COLLECTION_NAME = 'syncVaults';
const APP_ID = 'assistente-financeiro';
const ENCRYPTION_ITERATIONS = 250000;
const SYNC_DEBOUNCE_MS = 1600;

const runtime = {
  active: false,
  booting: false,
  ready: false,
  config: null,
  getData: null,
  setData: null,
  sessionId: 0,
  needsBoot: false,
  pushTimer: null,
  pendingData: null,
  ignoreNextLocalChange: false,
};

const readJson = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const bytesToBase64 = (bytes) => {
  const value = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  const chunkSize = 0x8000;

  for (let index = 0; index < value.length; index += chunkSize) {
    binary += String.fromCharCode(...value.subarray(index, index + chunkSize));
  }

  return btoa(binary);
};

const base64ToBytes = (value) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
};

const createRandomId = (length = 32) => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const getDeviceId = () => {
  let deviceId = localStorage.getItem(DEVICE_KEY);

  if (!deviceId) {
    deviceId = createRandomId(18);
    localStorage.setItem(DEVICE_KEY, deviceId);
  }

  return deviceId;
};

const normalizeFirebaseConfig = (input) => {
  const source = input?.firebaseConfig || input || {};
  const apiKey = source.apiKey?.trim();
  const projectId = source.projectId?.trim();

  if (!apiKey || !projectId) {
    throw new Error('Informe firebaseConfig com apiKey e projectId.');
  }

  return {
    ...source,
    apiKey,
    projectId,
  };
};

const normalizeConfig = (input) => {
  const firebaseConfig = normalizeFirebaseConfig(input);
  const syncId = String(input?.syncId || input?.id || '').trim();
  const chave = String(input?.chave || input?.senha || input?.secret || input?.passphrase || '').trim();

  if (!/^[A-Za-z0-9_-]{20,120}$/.test(syncId)) {
    throw new Error('Informe um syncId com 20 a 120 caracteres usando letras, números, _ ou -.');
  }

  if (chave.length < 8) {
    throw new Error('Use uma chave de sincronização com pelo menos 8 caracteres.');
  }

  return {
    enabled: true,
    firebaseConfig,
    syncId,
    chave,
    updatedAt: new Date().toISOString(),
  };
};

const readConfig = () => {
  const config = readJson(CONFIG_KEY);

  if (!config?.enabled || !config.firebaseConfig?.apiKey || !config.firebaseConfig?.projectId || !config.syncId || !config.chave) {
    return null;
  }

  return config;
};

const readMeta = () => readJson(META_KEY, {});

const saveMeta = (patch) => {
  const next = {
    ...readMeta(),
    ...patch,
    deviceId: getDeviceId(),
  };

  writeJson(META_KEY, next);
  return next;
};

const assertCryptoSupport = () => {
  if (!window.crypto?.subtle) {
    throw new Error('Criptografia indisponível neste navegador. Use HTTPS ou localhost.');
  }
};

const deriveKey = async (chave, salt) => {
  assertCryptoSupport();

  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(chave),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ENCRYPTION_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

const encryptPayload = async (value, chave) => {
  const encoder = new TextEncoder();
  const salt = new Uint8Array(16);
  const iv = new Uint8Array(12);

  crypto.getRandomValues(salt);
  crypto.getRandomValues(iv);

  const key = await deriveKey(chave, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(value)
  );

  return JSON.stringify({
    v: 1,
    alg: 'AES-GCM',
    kdf: 'PBKDF2-SHA256',
    iter: ENCRYPTION_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    data: bytesToBase64(encrypted),
  });
};

const decryptPayload = async (payload, chave) => {
  const envelope = JSON.parse(payload);

  if (envelope?.v !== 1 || !envelope.salt || !envelope.iv || !envelope.data) {
    throw new Error('Payload remoto não reconhecido.');
  }

  const decoder = new TextDecoder();
  const salt = base64ToBytes(envelope.salt);
  const iv = base64ToBytes(envelope.iv);
  const encrypted = base64ToBytes(envelope.data);
  const key = await deriveKey(chave, salt);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);

  return decoder.decode(decrypted);
};

const firestoreUrl = (config, params = []) => {
  const query = new URLSearchParams();
  query.set('key', config.firebaseConfig.apiKey);

  params.forEach(([key, value]) => {
    query.append(key, value);
  });

  return `https://firestore.googleapis.com/v1/projects/${config.firebaseConfig.projectId}/databases/(default)/documents/${COLLECTION_NAME}/${config.syncId}?${query.toString()}`;
};

const requestFirestore = async (url, options = {}) => {
  const response = await fetch(url, options);
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = new Error(body?.error?.message || `Erro ${response.status} no Firestore.`);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
};

const getFieldString = (field) => {
  if (!field || typeof field.stringValue !== 'string') {
    return '';
  }

  return field.stringValue;
};

const getRemoteVault = async (config) => {
  try {
    const document = await requestFirestore(firestoreUrl(config));
    const fields = document?.fields || {};

    return {
      payload: getFieldString(fields.payload),
      updatedAt: fields.updatedAt?.timestampValue || document?.updateTime || null,
      updateTime: document?.updateTime || null,
    };
  } catch (error) {
    if (error.status === 404) {
      return null;
    }

    throw error;
  }
};

const writeRemoteVault = async (config, payload) => {
  const updatedAt = new Date().toISOString();
  const params = [
    ['updateMask.fieldPaths', 'payload'],
    ['updateMask.fieldPaths', 'updatedAt'],
    ['updateMask.fieldPaths', 'schemaVersion'],
  ];

  const document = await requestFirestore(firestoreUrl(config, params), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        payload: { stringValue: payload },
        updatedAt: { timestampValue: updatedAt },
        schemaVersion: { integerValue: '1' },
      },
    }),
  });

  return {
    updatedAt,
    updateTime: document?.updateTime || null,
  };
};

const isEmptyRemotePayload = (payload) => {
  const value = String(payload || '').trim();
  return !value || value === '{}';
};

const prepareDataForSync = (data) => ({
  ...data,
  apiKey: '',
});

const buildSyncedData = (remoteData) => ({
  ...remoteData,
  apiKey: runtime.getData?.()?.apiKey || '',
});

const pushData = async (data, options = {}) => {
  const config = runtime.config || readConfig();

  if (!config) {
    throw new Error('Sincronismo não configurado.');
  }

  const meta = readMeta();
  const savedAt = meta.localUpdatedAt || new Date().toISOString();
  const content = {
    app: APP_ID,
    schemaVersion: 1,
    savedAt,
    deviceId: getDeviceId(),
    data: prepareDataForSync(data),
  };
  const encryptedPayload = await encryptPayload(JSON.stringify(content), config.chave);
  const remote = await writeRemoteVault(config, encryptedPayload);
  const now = new Date().toISOString();

  runtime.pendingData = null;

  return saveMeta({
    localUpdatedAt: savedAt,
    lastSyncedAt: now,
    lastPushedAt: now,
    lastRemoteUpdatedAt: remote.updatedAt,
    lastRemoteUpdateTime: remote.updateTime,
    lastDirection: options.reason || 'push',
  });
};

const pullData = async (options = {}) => {
  const config = runtime.config || readConfig();

  if (!config) {
    throw new Error('Sincronismo não configurado.');
  }

  const remote = await getRemoteVault(config);

  if (!remote || isEmptyRemotePayload(remote.payload)) {
    return { status: 'empty' };
  }

  const decrypted = JSON.parse(await decryptPayload(remote.payload, config.chave));

  if (decrypted?.app !== APP_ID || !decrypted.data) {
    throw new Error('Dados remotos incompatíveis com esta aplicação.');
  }

  const remoteSavedAt = decrypted.savedAt || remote.updatedAt || new Date().toISOString();
  const meta = readMeta();
  const localUpdatedAt = meta.localUpdatedAt || null;
  const shouldApply = options.force || !localUpdatedAt || new Date(remoteSavedAt) > new Date(localUpdatedAt);

  if (!shouldApply) {
    saveMeta({
      lastRemoteUpdatedAt: remote.updatedAt,
      lastRemoteUpdateTime: remote.updateTime,
      remoteSavedAt,
      lastCheckedAt: new Date().toISOString(),
    });

    return { status: 'local-newer', remoteSavedAt, localUpdatedAt };
  }

  runtime.ignoreNextLocalChange = true;
  runtime.setData?.(buildSyncedData(decrypted.data));

  window.setTimeout(() => {
    runtime.ignoreNextLocalChange = false;
  }, 3000);

  const now = new Date().toISOString();
  saveMeta({
    localUpdatedAt: remoteSavedAt,
    remoteSavedAt,
    lastSyncedAt: now,
    lastPulledAt: now,
    lastRemoteUpdatedAt: remote.updatedAt,
    lastRemoteUpdateTime: remote.updateTime,
    lastDirection: 'pull',
  });

  return { status: 'pulled', remoteSavedAt };
};

const startSync = async () => {
  const config = runtime.config || readConfig();

  if (!config) {
    return getSyncStatus();
  }

  if (runtime.booting) {
    runtime.needsBoot = true;
    return getSyncStatus();
  }

  const sessionId = runtime.sessionId;
  runtime.booting = true;
  runtime.ready = false;

  try {
    const remote = await getRemoteVault(config);

    if (sessionId !== runtime.sessionId) {
      return getSyncStatus();
    }

    if (!remote || isEmptyRemotePayload(remote.payload)) {
      await pushData(runtime.getData?.() || {}, { reason: 'initial-push' });
    } else {
      const decrypted = JSON.parse(await decryptPayload(remote.payload, config.chave));

      if (decrypted?.app !== APP_ID || !decrypted.data) {
        throw new Error('Dados remotos incompatíveis com esta aplicação.');
      }

      const meta = readMeta();
      const remoteSavedAt = decrypted.savedAt || remote.updatedAt || new Date().toISOString();
      const localUpdatedAt = meta.localUpdatedAt || null;

      if (!localUpdatedAt || new Date(remoteSavedAt) > new Date(localUpdatedAt)) {
        runtime.ignoreNextLocalChange = true;
        runtime.setData?.(buildSyncedData(decrypted.data));

        window.setTimeout(() => {
          runtime.ignoreNextLocalChange = false;
        }, 3000);

        saveMeta({
          localUpdatedAt: remoteSavedAt,
          remoteSavedAt,
          lastSyncedAt: new Date().toISOString(),
          lastPulledAt: new Date().toISOString(),
          lastRemoteUpdatedAt: remote.updatedAt,
          lastRemoteUpdateTime: remote.updateTime,
          lastDirection: 'pull',
        });
      } else if (new Date(localUpdatedAt) > new Date(remoteSavedAt)) {
        await pushData(runtime.getData?.() || {}, { reason: 'startup-push' });
      } else {
        saveMeta({
          remoteSavedAt,
          lastSyncedAt: new Date().toISOString(),
          lastRemoteUpdatedAt: remote.updatedAt,
          lastRemoteUpdateTime: remote.updateTime,
          lastDirection: 'already-synced',
        });
      }
    }

    runtime.ready = true;

    if (runtime.pendingData) {
      schedulePush(runtime.pendingData);
    }

    return getSyncStatus();
  } finally {
    runtime.booting = false;

    if (runtime.needsBoot && runtime.config && runtime.active) {
      runtime.needsBoot = false;
      startSync().catch((error) => {
        console.warn('[assistenteSync] Sincronismo não iniciado:', error);
      });
    }
  }
};

const schedulePush = (data) => {
  if (runtime.pushTimer) {
    window.clearTimeout(runtime.pushTimer);
  }

  runtime.pushTimer = window.setTimeout(async () => {
    runtime.pushTimer = null;

    try {
      await pushData(data, { reason: 'auto-push' });
    } catch (error) {
      console.warn('[assistenteSync] Falha ao enviar dados:', error);
    }
  }, SYNC_DEBOUNCE_MS);
};

export const notifySyncDataChange = (data) => {
  const config = runtime.config || readConfig();

  if (!config) {
    return;
  }

  if (runtime.ignoreNextLocalChange) {
    runtime.ignoreNextLocalChange = false;
    return;
  }

  saveMeta({
    localUpdatedAt: new Date().toISOString(),
    lastDirection: 'local-change',
  });

  if (!runtime.ready) {
    runtime.pendingData = data;
    return;
  }

  schedulePush(data);
};

const getSyncStatus = () => {
  const config = runtime.config || readConfig();
  const meta = readMeta();

  return {
    ativo: Boolean(config?.enabled),
    pronto: runtime.ready,
    projeto: config?.firebaseConfig?.projectId || null,
    syncId: config?.syncId || null,
    dispositivo: getDeviceId(),
    ultimaSincronizacao: meta.lastSyncedAt || null,
    ultimoEnvio: meta.lastPushedAt || null,
    ultimoDownload: meta.lastPulledAt || null,
    ultimaAlteracaoLocal: meta.localUpdatedAt || null,
    pendente: Boolean(runtime.pushTimer || runtime.pendingData),
  };
};

const getHelp = () => ({
  ativar: `await assistenteSync.ativar({ firebaseConfig, syncId: 'SEU_SYNC_ID', chave: 'SUA_CHAVE' })`,
  sincronizar: 'await assistenteSync.sincronizar()',
  subir: 'await assistenteSync.subir()',
  baixar: 'await assistenteSync.baixar()',
  status: 'assistenteSync.status()',
  desativar: 'assistenteSync.desativar()',
  limpar: 'assistenteSync.limpar()',
  gerarId: 'assistenteSync.gerarId()',
});

const createConsoleApi = () => ({
  ativar: async (input) => {
    const config = normalizeConfig(input);
    writeJson(CONFIG_KEY, config);
    runtime.config = config;
    runtime.ready = false;

    const status = await startSync();
    console.info('[assistenteSync] Sincronismo ativado:', status);
    return status;
  },
  sincronizar: async () => {
    const pullResult = await pullData();

    if (pullResult.status === 'empty' || pullResult.status === 'local-newer') {
      await pushData(runtime.getData?.() || {}, { reason: 'manual-sync' });
    }

    const status = getSyncStatus();
    console.info('[assistenteSync] Sincronização concluída:', status);
    return status;
  },
  subir: async () => {
    const result = await pushData(runtime.getData?.() || {}, { reason: 'manual-push' });
    console.info('[assistenteSync] Dados enviados:', getSyncStatus());
    return result;
  },
  baixar: async () => {
    const result = await pullData({ force: true });
    console.info('[assistenteSync] Dados baixados:', result);
    return result;
  },
  status: getSyncStatus,
  ajuda: getHelp,
  gerarId: createRandomId,
  desativar: () => {
    const config = readConfig();

    if (config) {
      writeJson(CONFIG_KEY, {
        ...config,
        enabled: false,
        updatedAt: new Date().toISOString(),
      });
    }

    runtime.config = null;
    runtime.ready = false;

    if (runtime.pushTimer) {
      window.clearTimeout(runtime.pushTimer);
      runtime.pushTimer = null;
    }

    return getSyncStatus();
  },
  limpar: () => {
    localStorage.removeItem(CONFIG_KEY);
    localStorage.removeItem(META_KEY);
    runtime.config = null;
    runtime.ready = false;
    runtime.pendingData = null;

    if (runtime.pushTimer) {
      window.clearTimeout(runtime.pushTimer);
      runtime.pushTimer = null;
    }

    return getSyncStatus();
  },
});

export const installSyncVault = ({ getData, setData }) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  runtime.active = true;
  runtime.sessionId += 1;
  runtime.getData = getData;
  runtime.setData = setData;
  runtime.config = readConfig();

  const api = createConsoleApi();
  window.assistenteSync = api;

  if (runtime.config) {
    startSync().catch((error) => {
      console.warn('[assistenteSync] Sincronismo não iniciado:', error);
    });
  }

  return () => {
    runtime.active = false;
    runtime.sessionId += 1;

    if (runtime.pushTimer) {
      window.clearTimeout(runtime.pushTimer);
      runtime.pushTimer = null;
    }

    if (window.assistenteSync === api) {
      delete window.assistenteSync;
    }
  };
};

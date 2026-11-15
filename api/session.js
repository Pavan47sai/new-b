import { randomUUID } from 'node:crypto';

const SESSION_KEY = 'gather-live-session';
const EMPTY_SESSION = {
  id: null,
  active: false,
  text: '',
  yes: 0,
  no: 0,
};

const START_SCRIPT = `
local raw = redis.call('GET', KEYS[1])
if raw then
  local current = cjson.decode(raw)
  if current.active then
    return cjson.encode({ error = 'already_active' })
  end
end
local session = cjson.decode(ARGV[1])
redis.call('SET', KEYS[1], ARGV[1])
return cjson.encode(session)
`;

const UPDATE_SCRIPT = `
local raw = redis.call('GET', KEYS[1])
if not raw then return cjson.encode({ error = 'inactive' }) end
local session = cjson.decode(raw)
if not session.active or session.id ~= ARGV[1] then
  return cjson.encode({ error = 'inactive' })
end
if ARGV[2] == 'updateText' then
  session.text = ARGV[3]
elseif ARGV[2] == 'end' then
  session.active = false
elseif ARGV[2] == 'respond' then
  if ARGV[3] ~= 'yes' and ARGV[3] ~= 'no' then
    return cjson.encode({ error = 'invalid_answer' })
  end
  session[ARGV[3]] = session[ARGV[3]] + 1
else
  return cjson.encode({ error = 'invalid_action' })
end
redis.call('SET', KEYS[1], cjson.encode(session))
return cjson.encode(session)
`;

async function redisCommand(command) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    const error = new Error('Shared session storage is not configured.');
    error.statusCode = 503;
    throw error;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  const result = await response.json();

  if (!response.ok || result.error) {
    throw new Error('The shared session storage request failed.');
  }

  return result.result;
}

function sendError(res, error) {
  if (error.statusCode === 503) {
    return res.status(503).json({
      error:
        'Shared session storage is not configured. Add the Upstash Redis environment variables in Vercel.',
    });
  }

  console.error('Session API error:', error);
  return res.status(500).json({
    error: 'The shared session service is unavailable. Try again shortly.',
  });
}

function sendScriptResult(res, result) {
  const session = JSON.parse(result);
  if (session.error === 'already_active') {
    return res.status(409).json({
      error: 'A session is already live. End it before starting another.',
    });
  }
  if (session.error === 'inactive') {
    return res.status(409).json({
      error: 'This session has ended or changed. Refresh and try again.',
    });
  }

  return res.status(200).json({ session });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    if (req.method === 'GET') {
      const storedSession = await redisCommand(['GET', SESSION_KEY]);
      return res.status(200).json({
        session: storedSession ? JSON.parse(storedSession) : EMPTY_SESSION,
      });
    }

    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ error: 'A valid JSON request is required.' });
    }

    if (body.action === 'start') {
      if (typeof body.text !== 'string' || !body.text.trim() || body.text.length > 500) {
        return res.status(400).json({
          error: 'Enter a session question or message up to 500 characters.',
        });
      }

      const session = {
        id: randomUUID(),
        active: true,
        text: body.text.trim(),
        yes: 0,
        no: 0,
      };
      const result = await redisCommand([
        'EVAL',
        START_SCRIPT,
        1,
        SESSION_KEY,
        JSON.stringify(session),
      ]);
      return sendScriptResult(res, result);
    }

    if (
      typeof body.sessionId !== 'string' ||
      !body.sessionId ||
      (body.action === 'updateText' &&
        (typeof body.text !== 'string' || body.text.length > 500)) ||
      (body.action === 'respond' && body.answer !== 'yes' && body.answer !== 'no') ||
      !['updateText', 'end', 'respond'].includes(body.action)
    ) {
      return res.status(400).json({ error: 'Invalid session action.' });
    }

    const value = body.action === 'updateText' ? body.text : body.answer || '';
    const result = await redisCommand([
      'EVAL',
      UPDATE_SCRIPT,
      1,
      SESSION_KEY,
      body.sessionId,
      body.action,
      value,
    ]);
    return sendScriptResult(res, result);
  } catch (error) {
    return sendError(res, error);
  }
}

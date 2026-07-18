// Feature definitions: each mode picks which inputs to attach and how to prompt.
// ctx = { transcript: [{channel:'you'|'them', text}], userText }

function formatTranscript(turns, limit) {
  const recent = limit ? turns.slice(-limit) : turns;
  return recent.map((t) => (t.channel === 'them' ? 'Them: ' : 'You: ') + t.text).join('\n');
}

// Shared directive: this user is primarily a software engineer. Bias every
// general-purpose answer toward practical, correct, production-minded engineering help.
const SWE = ' The user is a software engineer and uses cue mostly for engineering work. ' +
  'Answer with the concise correct answer only — no preamble, no filler, no recap. ' +
  'Prioritize technical accuracy. When code is involved: give complete, correct, ' +
  'idiomatic, runnable code in fenced blocks with the right language tag; prefer standard ' +
  'libraries and established patterns. Add at most one short line of context if needed for ' +
  'correctness (trade-off, bug, or assumption). Do not explain what is obvious. If a question ' +
  'is ambiguous, state the assumption in one clause and answer anyway.';

const MODES = {
  // One-shot "do the smart thing". Uses screen + recent transcript.
  assist: {
    needsScreen: true,
    userBubble: null,
    small: false,
    system:
      'You are cue, a discreet real-time copilot overlaid on the user\'s screen during a call or coding session. ' +
      'Look at the screenshot and the recent conversation, decide what the user needs RIGHT NOW, and give only the concise correct answer — no preamble, no padding. ' +
      'If the screen shows a coding/LeetCode problem: one-line approach, then the correct solution in a fenced code block, then time/space on one line. ' +
      'If it is a conversation: answer the current question or say exactly what the user should say next, in the first person. ' +
      'Never say "I can see" or describe the screenshot.' + SWE,
    build(ctx) {
      const t = formatTranscript(ctx.transcript, 12);
      return 'Recent conversation:\n' + (t || '(none)') + '\n\nRespond with what I need right now.';
    }
  },

  // Meeting copilot: what to say next.
  say: {
    needsScreen: false,
    userBubble: 'What should I say?',
    small: false,
    system:
      'You are cue, whispering suggested replies to the user during a live conversation. ' +
      '"Them" is the other person; "You" is the user. Based on what Them just said and what You already said, ' +
      'draft ONE short, natural, confident reply the user can say out loud, in the first person. No quotes, no preamble, 1–3 sentences.',
    build(ctx) {
      const t = formatTranscript(ctx.transcript, 14);
      return 'Conversation so far:\n' + (t || '(nothing heard yet — the user opened cue without audio)') +
        '\n\nWhat should I say next?';
    }
  },

  // Smart follow-up questions to keep the conversation going.
  followup: {
    needsScreen: false,
    userBubble: 'Follow-up questions',
    small: true,
    system:
      'You are cue. Given the conversation, suggest 2–4 sharp, relevant follow-up questions the user could ask next ' +
      'to sound engaged and drive the discussion. Return them as a short bullet list, nothing else.',
    build(ctx) {
      const t = formatTranscript(ctx.transcript, 20);
      return 'Conversation so far:\n' + (t || '(none)') + '\n\nSuggest follow-up questions.';
    }
  },

  // Recap of the whole session.
  recap: {
    needsScreen: false,
    userBubble: 'Recap',
    small: true,
    system:
      'You are cue. Summarize the conversation so far for someone who joined late: ' +
      'a few key points, any decisions, and action items. Use short bullets under bold headers. Be brief.',
    build(ctx) {
      const t = formatTranscript(ctx.transcript, 0);
      return 'Full transcript:\n' + (t || '(nothing captured yet)') + '\n\nRecap this.';
    }
  },

  // Free-form question typed in the composer. All three inputs as context.
  ask: {
    needsScreen: true,
    userBubble: null, // uses the typed text as the bubble
    small: false,
    system:
      'You are cue, a real-time copilot with access to the user\'s screen and live conversation. ' +
      'Answer the user\'s question with the concise correct answer only, grounded in what is on screen and what was said. ' +
      'No preamble, no filler, no "here\'s what you should do" framing — just the answer.' + SWE,
    build(ctx) {
      const t = formatTranscript(ctx.transcript, 12);
      return (t ? 'Recent conversation:\n' + t + '\n\n' : '') + 'Question: ' + ctx.userText;
    }
  },

  // Explicit LeetCode/coding screenshot solver (Cmd+H). Screen only.
  leetcode: {
    needsScreen: true,
    userBubble: 'Solve what\'s on screen',
    small: false,
    system:
      'You are an expert competitive programmer. The screenshot contains a coding problem. ' +
      'Respond with only: (1) one-line approach, (2) a clean, correct, idiomatic solution in a fenced code block ' +
      '(use the language shown on screen, else Python), (3) time and space complexity on one line. No restatement, no fluff.',
    build() { return 'Solve the coding problem shown in the screenshot.'; }
  }
};

module.exports = { MODES, formatTranscript };

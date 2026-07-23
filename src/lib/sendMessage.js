/**
 * sendMessage - Sends rich text via Telegram sendRichMessage API.
 */

export async function sendRichMessage({ token, chatId, markdown, method }) {
  const url = `https://api.telegram.org/bot${token}/${method}`;

  const payload = {
    chat_id: chatId,
    rich_message: { markdown },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return data;
}

export async function editRichMessage({ token, chatId, messageId, markdown }) {
  const url = `https://api.telegram.org/bot${token}/editMessageText`;

  const payload = {
    chat_id: chatId,
    message_id: messageId,
    rich_message: { markdown },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return data;
}

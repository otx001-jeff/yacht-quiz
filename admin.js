const $ = (s) => document.querySelector(s);
async function fetchJSON(url, opts={}){
  const res = await fetch(url, {credentials:'include', ...opts});
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}

async function loadAdmin(){
  try {
    const me = await fetchJSON('/api/session/me');
    if(!me.user.is_admin) throw new Error('Not admin');
    $("#admin-email").textContent = me.user.email;
    $("#admin-signed-out").style.display = "none";
    $("#admin-signed-in").style.display = "";
    const s = await fetchJSON('/api/admin/get-settings');
    $("#board-cost").value = s.BOARD_POST_COST;
    $("#chat-cost").value = s.CHAT_MESSAGE_COST;
    $("#roulette-limit").value = s.ROULETTE_DAILY_LIMIT;
  } catch(e){
    $("#admin-signed-out").style.display = "";
    $("#admin-signed-in").style.display = "none";
  }
}

window.onload = async () => {
  window.google?.accounts.id.initialize({
    client_id: (await fetchJSON('/api/config')).GOOGLE_CLIENT_ID,
    callback: async ({credential}) => {
      const me = await fetchJSON('/api/auth/verify', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ idToken: credential })
      });
      await loadAdmin();
    }
  });
  window.google?.accounts.id.renderButton(document.getElementById("g_id_signin_admin"), { theme: "outline", size: "large" });
  await loadAdmin();

  $("#admin-logout").addEventListener('click', async () => {
    await fetchJSON('/api/auth/logout', { method: 'POST' });
    location.reload();
  });

  $("#save-settings").addEventListener('click', async () => {
    const payload = {
      BOARD_POST_COST: Number($("#board-cost").value),
      CHAT_MESSAGE_COST: Number($("#chat-cost").value),
      ROULETTE_DAILY_LIMIT: Number($("#roulette-limit").value)
    };
    await fetchJSON('/api/admin/save-settings', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    alert('Saved!');
  });

  $("#send-message").addEventListener('click', async () => {
    const email = $("#target-email").value.trim();
    const title = $("#message-title").value.trim();
    const body = $("#message-body").value.trim();
    await fetchJSON('/api/admin/send-message', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, title, body }) });
    alert('Message stored in DB log.');
  });
};
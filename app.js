const $ = (s) => document.querySelector(s);

async function fetchJSON(url, opts={}){
  const res = await fetch(url, {credentials:'include', ...opts});
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}

function renderSignedIn(user){
  $("#signed-out").style.display = "none";
  $("#signed-in").style.display = "";
  $("#avatar").src = user.picture || "";
  $("#welcome").textContent = `Welcome, ${user.name || user.email}`;
  $("#email").textContent = user.email;
  $("#balance").textContent = user.yp_balance;
}

function renderSignedOut(){
  $("#signed-in").style.display = "none";
  $("#signed-out").style.display = "";
}

async function loadSession(){
  try {
    const me = await fetchJSON('/api/session/me');
    renderSignedIn(me.user);
  } catch(e){
    renderSignedOut();
  }
}

window.onload = async () => {
  // Google Sign-In button
  window.google?.accounts.id.initialize({
    client_id: (await fetchJSON('/api/config')).GOOGLE_CLIENT_ID,
    callback: async ({credential}) => {
      const me = await fetchJSON('/api/auth/verify', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ idToken: credential, referral: localStorage.getItem('ref') || '' })
      });
      renderSignedIn(me.user);
    }
  });
  window.google?.accounts.id.renderButton(document.getElementById("g_id_signin"), { theme: "outline", size: "large" });
  await loadSession();

  $("#logout").addEventListener('click', async () => {
    await fetchJSON('/api/auth/logout', { method: 'POST' });
    renderSignedOut();
  });

  // Quick Actions
  $("#btn-correct").addEventListener('click', async () => {
    const r = await fetchJSON('/api/points/update', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ delta: +10, reason: 'quiz_correct' }) });
    $("#balance").textContent = r.yp_balance;
    alert("+10 YP added");
  });
  $("#btn-wrong").addEventListener('click', async () => {
    const r = await fetchJSON('/api/points/update', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ delta: -10, reason: 'quiz_wrong' }) });
    $("#balance").textContent = r.yp_balance;
    alert("-10 YP deducted");
  });
  $("#btn-post").addEventListener('click', async () => {
    const r = await fetchJSON('/api/board/post', { method:'POST' });
    $("#balance").textContent = r.yp_balance;
    alert(`Board post created. YP deducted: ${r.cost}`);
  });
  $("#btn-chat").addEventListener('click', async () => {
    const r = await fetchJSON('/api/chat/send', { method:'POST' });
    $("#balance").textContent = r.yp_balance;
    alert(`Chat sent. YP deducted: ${r.cost}`);
  });
  $("#btn-spin").addEventListener('click', async () => {
    const r = await fetchJSON('/api/roulette/spin', { method:'POST' });
    $("#balance").textContent = r.yp_balance;
    alert(`Roulette: ${r.result.label}`);
  });

  // Stripe buttons
  document.querySelectorAll(".buy").forEach(btn => {
    btn.addEventListener('click', async () => {
      const plan = btn.dataset.plan;
      const { url } = await fetchJSON('/api/checkout/create-session', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ plan })
      });
      location.href = url;
    });
  });
};
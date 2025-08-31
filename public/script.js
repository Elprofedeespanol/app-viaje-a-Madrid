let dossier = null;

document.getElementById("form-inscription").addEventListener("submit", async function(e) {
  e.preventDefault();
  const nom = document.getElementById("nom-eleve").value.trim();
  const classe = document.getElementById("classe-eleve").value;
  const tuteur = document.getElementById("nom-tuteur").value.trim();
  const email = document.getElementById("email-tuteur").value;
  const tel = document.getElementById("telephone-tuteur").value;
  const message = document.getElementById("message-form");

  const resValid = await fetch('/api/valider', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nom, classe })
  });

  const { valide } = await resValid.json();
  if (!valide) {
    message.innerHTML = "❌ Nom ou classe invalide.";
    message.className = "error";
    return;
  }

  const resInsc = await fetch('/api/inscrire', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nomEleve: nom, classe, nomTuteur: tuteur, emailTuteur: email, telephoneTuteur: tel })
  });

  const data = await resInsc.json();
  dossier = { code: data.code };

  document.getElementById("code-dossier").textContent = dossier.code;
  document.getElementById("formulaire").classList.add("hidden");
  document.getElementById("dashboard").classList.remove("hidden");

  document.getElementById("message-form").innerHTML = `✅ Inscription réussie ! Code : ${dossier.code}`;
  document.getElementById("message-form").className = "success";
});

async function sauvegarder() {
  const documents = {
    passeport: document.getElementById("passeport").checked,
    visa: document.getElementById("visa").checked,
    autorisation: document.getElementById("autorisation").checked,
    medical: document.getElementById("medical").checked
  };
  const paiements = {
    sep: document.getElementById("paiement-sep").checked,
    oct: document.getElementById("paiement-oct").checked,
    nov: document.getElementById("paiement-nov").checked,
    dec: document.getElementById("paiement-dec").checked,
    jan: document.getElementById("paiement-jan").checked,
    fev: document.getElementById("paiement-fev").checked,
    mar: document.getElementById("paiement-mar").checked,
    avr: document.getElementById("paiement-avr").checked
  };

  await fetch(`/api/dossier/${dossier.code}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documents, paiements })
  });

  document.getElementById("message-sauv").innerHTML = "✅ Sauvegardé.";
  document.getElementById("message-sauv").className = "success";
}

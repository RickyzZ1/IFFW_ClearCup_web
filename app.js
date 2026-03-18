const revealTargets = document.querySelectorAll("[data-reveal]");

if (revealTargets.length > 0) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealTargets.forEach((target) => io.observe(target));
}

const tabButtons = document.querySelectorAll(".tab-btn");
const forms = document.querySelectorAll(".auth-form");
const authFeedback = document.getElementById("auth-feedback");

if (tabButtons.length > 0) {
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.tabTarget;
      tabButtons.forEach((b) => b.classList.toggle("is-active", b === button));
      forms.forEach((form) => {
        form.classList.toggle("is-hidden", form.dataset.form !== target);
      });
      if (authFeedback) authFeedback.textContent = "";
    });
  });
}

const signInForm = document.getElementById("signin-form");
if (signInForm) {
  signInForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(signInForm);
    const email = String(data.get("email") || "").trim();
    const role = String(data.get("role") || "");
    if (!email || !role) return;

    localStorage.setItem(
      "clearcup_member",
      JSON.stringify({
        email,
        role,
        signedAt: new Date().toISOString(),
      })
    );

    if (authFeedback) authFeedback.textContent = "Signed in. Redirecting to auction...";
    setTimeout(() => {
      window.location.href = "auction.html";
    }, 850);
  });
}

const signUpForm = document.getElementById("signup-form");
if (signUpForm) {
  signUpForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (authFeedback) {
      authFeedback.textContent = "Application received. We will contact you within 24 hours.";
    }
    signUpForm.reset();
  });
}

const memberNote = document.getElementById("member-note");
if (memberNote) {
  const memberRaw = localStorage.getItem("clearcup_member");
  if (memberRaw) {
    try {
      const member = JSON.parse(memberRaw);
      memberNote.textContent = `Signed in as ${member.email} (${member.role}). You can bid and track lots.`;
    } catch {
      memberNote.textContent = "Guest mode: sign in to save watchlists and bidding history.";
    }
  }
}

function updateCountdown(el) {
  const endTime = new Date(el.dataset.countdown).getTime();
  const now = Date.now();
  const diff = endTime - now;

  if (Number.isNaN(endTime)) {
    el.textContent = "Date invalid";
    return;
  }
  if (diff <= 0) {
    el.textContent = "Auction closed";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);

  el.textContent = `${days}d ${hours}h ${mins}m ${secs}s`;
}

const countdownNodes = document.querySelectorAll("[data-countdown]");
if (countdownNodes.length > 0) {
  countdownNodes.forEach(updateCountdown);
  setInterval(() => {
    countdownNodes.forEach(updateCountdown);
  }, 1000);
}

function formatUsdPerLb(value) {
  return `$${value.toFixed(2)}/lb`;
}

function updatePriceTransparency(card) {
  const currentBid = Number(card.dataset.currentBid || "0");
  const payoutRatio = Number(card.dataset.payoutRatio || "0");
  const livingPrice = Number(card.dataset.livingPrice || "0");
  const minimumGuarantee = Number(card.dataset.minGuarantee || "0");
  const farmerReturn = currentBid * payoutRatio;
  const gap = farmerReturn - livingPrice;

  const returnNode = card.querySelector("[data-field='farmer-return']");
  const livingNode = card.querySelector("[data-field='living-price']");
  const statusNode = card.querySelector("[data-field='fair-status']");
  const noteNode = card.querySelector("[data-field='fair-note']");

  if (returnNode) returnNode.textContent = formatUsdPerLb(farmerReturn);
  if (livingNode) livingNode.textContent = formatUsdPerLb(livingPrice);

  if (statusNode) {
    statusNode.classList.remove("is-fair", "is-gap");
    if (gap >= 0) {
      statusNode.classList.add("is-fair");
      statusNode.textContent = `Fair income check: benchmark met (+$${gap.toFixed(2)}/lb).`;
    } else {
      statusNode.classList.add("is-gap");
      statusNode.textContent = `Fair income check: below benchmark by $${Math.abs(gap).toFixed(2)}/lb.`;
    }
  }

  if (noteNode) {
    noteNode.textContent =
      `At current bid, estimated farmer return is ${formatUsdPerLb(farmerReturn)} ` +
      `(payout ratio ${(payoutRatio * 100).toFixed(0)}%). ` +
      `Minimum guarantee starts at ${formatUsdPerLb(minimumGuarantee)}.`;
  }
}

const lotCards = document.querySelectorAll(".lot-card");
if (lotCards.length > 0) {
  lotCards.forEach(updatePriceTransparency);
}

const bidForms = document.querySelectorAll(".bid-form");
if (bidForms.length > 0) {
  bidForms.forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const card = form.closest(".lot-card");
      const input = form.querySelector("input[type='number']");
      const feedback = card ? card.querySelector(".feedback") : null;
      const priceNode = card ? card.querySelector(".price-value") : null;

      if (!card || !input || !feedback || !priceNode) return;
      const currentBid = Number(card.dataset.currentBid || "0");
      const nextBid = Number(input.value);

      if (Number.isNaN(nextBid) || nextBid <= currentBid) {
        feedback.textContent = `Bid must be higher than $${currentBid.toFixed(2)}/lb.`;
        return;
      }

      card.dataset.currentBid = nextBid.toFixed(2);
      priceNode.textContent = `$${nextBid.toFixed(2)}/lb`;
      updatePriceTransparency(card);
      input.min = (nextBid + 0.1).toFixed(1);
      input.value = "";
      feedback.textContent = `Bid accepted. Leading price is now $${nextBid.toFixed(2)}/lb.`;
    });
  });
}

const trackFilterButtons = document.querySelectorAll("[data-track-filter]");
const trackCards = document.querySelectorAll("[data-track-origin]");

if (trackFilterButtons.length > 0 && trackCards.length > 0) {
  trackFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.trackFilter || "all";
      trackFilterButtons.forEach((b) => b.classList.toggle("is-active", b === button));

      trackCards.forEach((card) => {
        const origin = card.dataset.trackOrigin || "";
        const show = filter === "all" || origin === filter;
        card.classList.toggle("is-hidden", !show);
      });
    });
  });
}

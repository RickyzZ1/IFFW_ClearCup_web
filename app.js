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
      "iffw_member",
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
  const memberRaw = localStorage.getItem("iffw_member");
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
      input.min = (nextBid + 0.1).toFixed(1);
      input.value = "";
      feedback.textContent = `Bid accepted. Leading price is now $${nextBid.toFixed(2)}/lb.`;
    });
  });
}

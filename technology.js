// =======================================
// TRADESPHERE TECHNOLOGY MARKETPLACE
// =======================================


// MOBILE NAVIGATION

const techMenuToggle = document.getElementById("techMenuToggle");
const techNav = document.getElementById("techNav");

if (techMenuToggle && techNav) {

  techMenuToggle.addEventListener("click", () => {

    const isOpen = techNav.classList.toggle("open");

    techMenuToggle.setAttribute(
      "aria-expanded",
      String(isOpen)
    );

  });

  techNav.querySelectorAll("a").forEach(link => {

    link.addEventListener("click", () => {

      techNav.classList.remove("open");

      techMenuToggle.setAttribute(
        "aria-expanded",
        "false"
      );

    });

  });

}


// SERVICE FILTERS

const techFilters = document.querySelectorAll(".tech-filter");
const techCards = document.querySelectorAll(".tech-card");

techFilters.forEach(button => {

  button.addEventListener("click", () => {

    techFilters.forEach(filter => {
      filter.classList.remove("active");
    });

    button.classList.add("active");

    const selectedFilter = button.dataset.filter;

    techCards.forEach(card => {

      const matches =
        selectedFilter === "all" ||
        card.dataset.category === selectedFilter;

      card.hidden = !matches;

    });

  });

});


// SELECT SERVICE FROM A CARD

const requestedService =
  document.getElementById("requestedService");

const enquirySection =
  document.getElementById("tech-enquiry");

document.querySelectorAll(".tech-card-button").forEach(button => {

  button.addEventListener("click", () => {

    const service = button.dataset.service;

    requestedService.value = service;

    enquirySection.scrollIntoView({
      behavior: "smooth"
    });

  });

});


// WHATSAPP ENQUIRY

const enquiryForm =
  document.getElementById("techEnquiryForm");

const formStatus =
  document.getElementById("techFormStatus");

const whatsappNumber = "254769551181";


enquiryForm.addEventListener("submit", event => {

  event.preventDefault();

  const name =
    document.getElementById("clientName").value.trim();

  const service =
    requestedService.options[
      requestedService.selectedIndex
    ].text;

  const platform =
    document.getElementById("tradingPlatform").value;

  const market =
    document.getElementById("tradingMarket").value;

  const brief =
    document.getElementById("projectBrief").value.trim();


  if (!service || !platform || !market || brief.length < 15) {

    formStatus.textContent =
      "Please complete the required fields and provide a clearer project description.";

    return;

  }


  const message = [
    "Hello TradeSphere.",
    "",
    "I would like to make a technology enquiry.",
    "",
    `Name: ${name || "Not provided"}`,
    `Service: ${service}`,
    `Platform: ${platform}`,
    `Market: ${market}`,
    "",
    "Project requirements:",
    brief,
    "",
    "Please let me know the next steps."
  ].join("\n");


  const whatsappURL =
    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;


  formStatus.textContent =
    "Opening WhatsApp. Review your message before sending.";

  window.location.href = whatsappURL;

});


// FOOTER YEAR

document.getElementById("techYear").textContent =
  new Date().getFullYear();


/* ==========================================
   TRADESPHERE - COMMERCIAL PAGES
   File: commerce.js
   ========================================== */

"use strict";

document.addEventListener("DOMContentLoaded", function () {

  // ==========================================
  // 1. MOBILE NAVIGATION
  // ==========================================

  const menuButton = document.getElementById("tsMenu");
  const navigation = document.getElementById("tsNav");

  if (menuButton && navigation) {

    menuButton.addEventListener("click", function () {

      const isOpen = navigation.classList.toggle("active");

      menuButton.setAttribute(
        "aria-expanded",
        String(isOpen)
      );

      menuButton.setAttribute(
        "aria-label",
        isOpen ? "Close navigation" : "Open navigation"
      );

      menuButton.textContent = isOpen ? "✕" : "☰";

    });

    // Close menu after selecting a navigation link
    const navLinks = navigation.querySelectorAll("a");

    navLinks.forEach(function (link) {

      link.addEventListener("click", function () {

        navigation.classList.remove("active");

        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Open navigation");

        menuButton.textContent = "☰";

      });

    });

  }


  // ==========================================
  // 2. AUTOMATIC FOOTER YEAR
  // ==========================================

  const yearElements = document.querySelectorAll(
    "[data-current-year]"
  );

  yearElements.forEach(function (element) {

    element.textContent = new Date().getFullYear();

  });


  // ==========================================
  // 3. CUSTOMER REVIEW FORM
  // ==========================================

  const reviewForm = document.getElementById("reviewForm");

  if (reviewForm) {

    reviewForm.addEventListener("submit", function (event) {

      event.preventDefault();

      // Get form values
      const reviewerName =
        document.getElementById("reviewerName").value.trim();

      const reviewedItem =
        document.getElementById("reviewedItem").value;

      const rating =
        document.getElementById("rating").value;

      const permission =
        document.getElementById("permission").value;

      const reviewText =
        document.getElementById("reviewText").value.trim();


      // Validate required information
      if (
        !reviewerName ||
        !reviewedItem ||
        !rating ||
        !permission ||
        !reviewText
      ) {

        alert("Please complete all the required fields.");

        return;

      }


      // Check minimum feedback length
      if (reviewText.length < 15) {

        alert("Please provide at least 15 characters of feedback.");

        return;

      }


      // Build WhatsApp message
      const message =

        "TRADESPHERE CUSTOMER REVIEW SUBMISSION\n\n" +

        "Name: " + reviewerName + "\n\n" +

        "Product or service: " + reviewedItem + "\n\n" +

        "Rating: " + rating + "/5\n\n" +

        "Permission to publish: " +
        (permission === "yes" ? "Yes" : "No") +
        "\n\n" +

        "Customer feedback:\n" +
        reviewText +
        "\n\n" +

        "Please review this submission before publication.";


      // Encode message for WhatsApp
      const encodedMessage = encodeURIComponent(message);

      const whatsappNumber = "254769551181";

      const whatsappURL =
        "https://wa.me/" +
        whatsappNumber +
        "?text=" +
        encodedMessage;


      // Open WhatsApp
      window.location.href = whatsappURL;

    });

  }

});
                                

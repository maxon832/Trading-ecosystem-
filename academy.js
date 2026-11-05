
// TradeSphere Academy

// Automatic copyright year
document.getElementById("year").textContent =
    new Date().getFullYear();

// Mobile navigation
const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");

menuToggle.addEventListener("click", function () {
    const isOpen = navMenu.classList.toggle("active");

    menuToggle.setAttribute("aria-expanded", isOpen);
    menuToggle.textContent = isOpen ? "✕" : "☰";
});

navMenu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
        navMenu.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.textContent = "☰";
    });
});

// Course filter
const filterButtons = document.querySelectorAll(".filter-btn");
const courses = document.querySelectorAll(".academy-course");

filterButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        const selected = button.dataset.filter;

        filterButtons.forEach(function (item) {
            item.classList.remove("active");
        });

        button.classList.add("active");

        courses.forEach(function (course) {

            const level = course.dataset.level;

            course.hidden =
                selected !== "all" && selected !== level;

        });

    });

});

// Course information
const courseData = {

    "Forex Foundations": {
        description: "An introduction to the Forex market and the language used by traders.",
        topics: [
            "Currency pairs and quotations",
            "Pips, spreads and lot sizes",
            "Leverage and margin",
            "Trading sessions",
            "Introduction to risk"
        ]
    },

    "Technical Analysis": {
        description: "Understand how traders interpret price charts and market behaviour.",
        topics: [
            "Candlestick anatomy",
            "Support and resistance",
            "Trend identification",
            "Chart patterns",
            "Basic technical indicators"
        ]
    },

    "Smart Money Concepts": {
        description: "Study market structure, liquidity and price delivery using SMC concepts.",
        topics: [
            "Break of Structure (BOS)",
            "Change of Character (CHoCH)",
            "Liquidity sweeps",
            "Order blocks",
            "Fair Value Gaps (FVG)"
        ]
    },

    "Risk Management": {
        description: "Develop a structured approach to controlling trading risk.",
        topics: [
            "Position sizing",
            "Risk-to-reward ratios",
            "Stop-loss placement",
            "Drawdown management",
            "Trading psychology"
        ]
    },

    "Candle Range Theory": {
        description: "Explore candle ranges and their application in structured market analysis.",
        topics: [
            "Candle range identification",
            "Range highs and lows",
            "Liquidity interactions",
            "Range expansion",
            "Multi-timeframe analysis"
        ]
    },

    "Advanced Price Action": {
        description: "Study advanced price-action frameworks and systematic trade planning.",
        topics: [
            "Accumulation, manipulation and distribution",
            "Smart Money Technique (SMT)",
            "Multi-timeframe confluence",
            "Trade execution planning",
            "Strategy evaluation"
        ]
    }

};

// Modal controls
const modal = document.getElementById("courseModal");
const modalTitle = document.getElementById("modalTitle");
const modalDescription = document.getElementById("modalDescription");
const modalTopics = document.getElementById("modalTopics");
const modalClose = document.getElementById("modalClose");
const enquiry = document.getElementById("courseEnquiry");

document.querySelectorAll(".course-btn").forEach(function (button) {

    button.addEventListener("click", function () {

        const name = button.dataset.course;
        const course = courseData[name];

        if (!course) return;

        modalTitle.textContent = name;
        modalDescription.textContent = course.description;

        modalTopics.replaceChildren();

        course.topics.forEach(function (topic) {
            const li = document.createElement("li");
            li.textContent = topic;
            modalTopics.appendChild(li);
        });

        const message =
            "Hello, I would like to enquire about the " +
            name + " course at TradeSphere.";

        enquiry.href =
            "https://wa.me/254769551181?text=" +
            encodeURIComponent(message);

        modal.hidden = false;
        document.body.style.overflow = "hidden";

        modalClose.focus();

    });

});

function closeCourseModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
}

modalClose.addEventListener("click", closeCourseModal);

modal.addEventListener("click", function (event) {
    if (event.target === modal) {
        closeCourseModal();
    }
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !modal.hidden) {
        closeCourseModal();
    }
});

console.log("TradeSphere Academy loaded successfully.");
          

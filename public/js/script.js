(() => {
  const pageLoader = document.querySelector("[data-page-loader]");
  const pageLoaderMessage = pageLoader?.querySelector("[data-page-loader-message]");

  const showPageLoader = (message) => {
    if (!pageLoader) return;
    if (pageLoaderMessage && message) pageLoaderMessage.textContent = message;
    pageLoader.hidden = false;
    document.body.classList.add("page-is-loading");
  };

  document.querySelectorAll(".flash-message").forEach((message) => {
    message.querySelector(".toast-dismiss")?.addEventListener("click", () => message.remove());
    window.setTimeout(() => {
      message.classList.remove("show");
      window.setTimeout(() => message.remove(), 180);
    }, 2220);
  });

  document.querySelectorAll("[data-nav-menu-toggle]").forEach((toggle) => {
    const menu = document.getElementById(toggle.getAttribute("aria-controls"));
    if (!menu) return;

    const setMenuOpen = (isOpen) => {
      menu.hidden = !isOpen;
      toggle.setAttribute("aria-expanded", String(isOpen));
      if (isOpen) menu.querySelector("a")?.focus();
    };

    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      setMenuOpen(menu.hidden);
    });
    menu.addEventListener("click", (event) => event.stopPropagation());
    document.addEventListener("click", () => setMenuOpen(false));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    });
  });

  const getMessage = (el, fb) => {
    const v = el.validity;
    if (v.customError) return el.validationMessage;
    if (v.valueMissing) return fb.dataset.required;
    if (v.tooShort) return `Must be at least ${el.minLength} characters.`;
    if (v.tooLong) return `Must be at most ${el.maxLength} characters.`;
    if (v.typeMismatch)
      return el.type === "email"
        ? "Enter a valid email address."
        : "Enter a valid value.";
    if (v.patternMismatch)
      return "Enter a valid URL starting with http:// or https://";
    if (v.rangeUnderflow) return `Must be at least ${el.min}.`;
    if (v.rangeOverflow) return `Must be at most ${el.max}.`;
    if (v.badInput) return "Enter a valid number.";
    return "Invalid value.";
  };

  document.querySelectorAll(".needs-validation").forEach((form) => {
    const fields = form.querySelectorAll("input, textarea, select");

    const showMessage = (el) => {
      const fb = el.parentElement.querySelector(".invalid-feedback");
      if (!fb) return;

      if (!el.validity.valid) {
        fb.textContent = getMessage(el, fb);
        el.classList.add("is-invalid");
        el.classList.remove("is-valid");
      } else if (el.value.trim()) {
        el.classList.remove("is-invalid");
        el.classList.add("is-valid");
      } else {
        el.classList.remove("is-invalid", "is-valid");
      }
    };

    fields.forEach((el) => {
      const fb = el.parentElement.querySelector(".invalid-feedback");
      if (fb) fb.dataset.required = fb.textContent.trim(); // keep your original text
      el.addEventListener("input", () => showMessage(el));
      el.addEventListener("blur", () => showMessage(el));
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      e.stopPropagation();

      fields.forEach((el) => {
        if (el.type !== "number" && el.type !== "file") {
          el.value = el.value.trim();
        }
      });

      form.classList.add("was-validated");
      fields.forEach(showMessage);

      if (form.checkValidity()) {
        if (form.matches("[data-listing-form]")) {
          showPageLoader(form.dataset.loadingMessage);
          form.querySelector('button[type="submit"]')?.setAttribute("disabled", "disabled");
        }
        HTMLFormElement.prototype.submit.call(form);
      }
    }, false);
  });

  document.querySelectorAll('input[type="file"][data-max-files]').forEach((input) => {
    input.addEventListener("change", () => {
      const limit = Number(input.dataset.maxFiles);
      input.setCustomValidity(input.files.length > limit ? `Choose no more than ${limit} images.` : "");
    });
  });

  document.querySelectorAll("[data-carousel]").forEach((carousel) => {
    const slides = [...carousel.querySelectorAll(".listing-slide")];
    const dots = [...carousel.querySelectorAll(".carousel-dots i")];
    if (slides.length < 2) return;
    let activeIndex = 0;

    const showSlide = (index) => {
      activeIndex = (index + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => slide.classList.toggle("is-active", slideIndex === activeIndex));
      dots.forEach((dot, dotIndex) => dot.classList.toggle("active", dotIndex === activeIndex));
    };

    carousel.querySelector(".carousel-prev")?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      showSlide(activeIndex - 1);
    });
    carousel.querySelector(".carousel-next")?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      showSlide(activeIndex + 1);
    });
  });

  document.querySelectorAll("[data-save-listing]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (button.dataset.requiresLogin === "true") {
        window.location.href = "/login?message=save";
        return;
      }

      if (button.disabled) return;
      const isSaved = button.getAttribute("aria-pressed") === "true";
      button.disabled = true;

      try {
        const response = await fetch(`/listing/${button.dataset.listingId}/save`, {
          method: isSaved ? "DELETE" : "POST",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error("Unable to update saved listing");

        button.classList.toggle("is-saved", !isSaved);
        button.setAttribute("aria-pressed", String(!isSaved));
        button.setAttribute("aria-label", !isSaved ? "Remove from saved places" : "Save this place");
        const buttonText = button.querySelector("span");
        if (buttonText) buttonText.textContent = !isSaved ? "Saved" : "Save";
      } catch (error) {
        console.error(error);
      } finally {
        button.disabled = false;
      }
    });
  });

  document.querySelectorAll("[data-share-listing]").forEach((button) => {
    button.addEventListener("click", async () => {
      const title = document.querySelector(".detail-heading h1")?.textContent.trim() || "Stayora listing";
      const shareData = { title, text: `Take a look at ${title}`, url: window.location.href };
      const buttonText = button.querySelector("span");

      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(window.location.href);
          if (buttonText) buttonText.textContent = "Link copied";
          window.setTimeout(() => {
            if (buttonText) buttonText.textContent = "Share";
          }, 1800);
        }
      } catch (error) {
        if (error.name !== "AbortError") console.error("Sharing failed:", error);
      }
    });
  });

  document.querySelectorAll("[data-photo-gallery]").forEach((gallery) => {
    const photos = [...gallery.querySelectorAll("[data-gallery-image]")];
    const modal = document.querySelector("[data-photo-modal]");
    if (!photos.length || !modal) return;

    const modalImage = modal.querySelector("[data-modal-image]");
    const modalCount = modal.querySelector("[data-modal-count]");
    let activeIndex = 0;

    const renderPhoto = () => {
      const image = photos[activeIndex].querySelector("img");
      modalImage.src = image.currentSrc || image.src;
      modalImage.alt = image.alt;
      modalCount.textContent = `${activeIndex + 1} / ${photos.length}`;
    };

    const openModal = (index = 0) => {
      activeIndex = (index + photos.length) % photos.length;
      renderPhoto();
      modal.hidden = false;
      document.body.classList.add("photo-modal-open");
    };

    const closeModal = () => {
      modal.hidden = true;
      document.body.classList.remove("photo-modal-open");
    };

    photos.forEach((photo) => {
      photo.addEventListener("click", () => openModal(Number(photo.dataset.photoIndex)));
    });
    gallery.querySelector("[data-open-gallery]")?.addEventListener("click", () => openModal());
    modal.querySelectorAll("[data-close-gallery]").forEach((control) => control.addEventListener("click", closeModal));
    modal.querySelector("[data-modal-prev]")?.addEventListener("click", () => openModal(activeIndex - 1));
    modal.querySelector("[data-modal-next]")?.addEventListener("click", () => openModal(activeIndex + 1));
    document.addEventListener("keydown", (event) => {
      if (modal.hidden) return;
      if (event.key === "Escape") closeModal();
      if (event.key === "ArrowLeft") openModal(activeIndex - 1);
      if (event.key === "ArrowRight") openModal(activeIndex + 1);
    });
  });

  document.querySelectorAll("[data-reservation-form]").forEach((form) => {
    const checkIn = form.querySelector('[name="reservation[checkIn]"]');
    const checkOut = form.querySelector('[name="reservation[checkOut]"]');
    const guests = form.querySelector('[name="reservation[guests]"]');
    const nightsOutput = form.querySelector("[data-booking-nights]");
    const totalOutput = form.querySelector("[data-booking-total]");
    const summary = form.querySelector(".booking-summary");
    const errorOutput = form.querySelector("[data-booking-error]");
    const price = Number(form.dataset.price);
    const day = 24 * 60 * 60 * 1000;

    const updateBooking = () => {
      errorOutput.hidden = true;
      const start = checkIn.value ? new Date(`${checkIn.value}T00:00:00`) : null;
      const end = checkOut.value ? new Date(`${checkOut.value}T00:00:00`) : null;
      const nights = start && end ? Math.round((end - start) / day) : 0;
      summary.hidden = nights <= 0;
      nightsOutput.textContent = nights > 0 ? `${nights} night${nights === 1 ? "" : "s"}` : "Choose your dates";
      totalOutput.textContent = nights > 0 ? `₹${(nights * price).toLocaleString("en-IN")}` : "₹0";
      const guestCount = Number(guests.value) || 1;
      const total = nights * price * guestCount;
      if (nights > 0) totalOutput.textContent = `\u20B9${total.toLocaleString("en-IN")}`;
      if (checkIn.value) checkOut.min = checkIn.value;
      return nights;
    };

    [checkIn, checkOut, guests].forEach((input) => {
      input.addEventListener("change", updateBooking);
      input.addEventListener("input", updateBooking);
    });
    form.querySelector("[data-guest-decrease]")?.addEventListener("click", () => {
      guests.value = Math.max(1, Number(guests.value || 1) - 1);
      updateBooking();
    });
    form.querySelector("[data-guest-increase]")?.addEventListener("click", () => {
      guests.value = Math.min(16, Number(guests.value || 1) + 1);
      updateBooking();
    });
    form.addEventListener("submit", (event) => {
      const nights = updateBooking();
      const guestCount = Number(guests.value);
      if (!checkIn.value || !checkOut.value || nights < 1) {
        event.preventDefault();
        errorOutput.textContent = "Choose a valid check-in and checkout date.";
        errorOutput.hidden = false;
      } else if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 16) {
        event.preventDefault();
        errorOutput.textContent = "Choose between 1 and 16 guests.";
        errorOutput.hidden = false;
      }
    });
  });
})();

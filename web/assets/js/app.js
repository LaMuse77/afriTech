// 1. Un seul enregistrement global du plugin au top du fichier
gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () => {
    // Vérification de sécurité globale
    if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
        initHeroAnimations();
        initAccordionGSAP();
        initScrollAnimations();
    }
});

/* ==========================================
   ANIMATION DU HERO (A L'OUVERTURE DE PAGE)
   ========================================== */
function initHeroAnimations() {
    const heroTitle = document.querySelector("#Hero h1");
    if (!heroTitle) return; // Sécurité si l'élément n'existe pas

    // Découpage des lettres
    heroTitle.innerHTML = heroTitle.textContent
        .split("")
        .map(letter => `<span class="hero-letter" style="display:inline-block;">${letter === " " ? "&nbsp;" : letter}</span>`)
        .join("");

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    tl.from(".main-header", { y: -50, opacity: 0, duration: 1 })
      .from("#Hero .hero-badge", { y: 20, opacity: 0, duration: 0.6 }, "-=0.4")
      .from("#Hero h1 .hero-letter", {
          y: -40,
          opacity: 0,
          scaleY: 1.3,
          duration: 0.5,
          stagger: 0.02, // Plus rapide pour éviter l'effet de lourdeur
          ease: "back.out(1.5)"
      }, "-=0.5")
      .from("#Hero h2", { y: 20, opacity: 0, duration: 0.8 }, "-=0.4")
      .from("#Hero p", { y: 20, opacity: 0, duration: 0.8 }, "-=0.6")
      .from("#Hero .btn", { y: 15, opacity: 0, duration: 0.6, stagger: 0.1 }, "-=0.6");
}

/* ==========================================
   ACCORDÉON NETTOYÉ ET FUSIONNÉ (SANS DOUBLON)
   ========================================== */
function initAccordionGSAP() {
    const items = document.querySelectorAll(".accordion-item");
    if (!items.length) return;

    items.forEach(item => {
        const trigger = item.querySelector(".accordion-trigger");
        const content = item.querySelector(".accordion-content");
        const icon = item.querySelector(".acc-icon");

        if (!trigger || !content) return;

        trigger.addEventListener("click", () => {
            const isOpen = item.classList.contains("is-open");

            // Fermer les autres accordéons ET remettre leurs icônes à 0°
            items.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains("is-open")) {
                    const otherContent = otherItem.querySelector(".accordion-content");
                    const otherIcon = otherItem.querySelector(".acc-icon");
                    
                    otherItem.classList.remove("is-open");
                    gsap.to(otherContent, { height: 0, duration: 0.3, ease: "power2.out" });
                    if (otherIcon) gsap.to(otherIcon, { rotation: 0, duration: 0.3, ease: "power2.out" });
                }
            });

            // Basculer l'état de l'élément cliqué
            if (isOpen) {
                item.classList.remove("is-open");
                gsap.to(content, { height: 0, duration: 0.3, ease: "power2.out" });
                if (icon) gsap.to(icon, { rotation: 0, duration: 0.3, ease: "power2.out" });
            } else {
                item.classList.add("is-open");
                gsap.to(content, { height: "auto", duration: 0.4, ease: "power3.out" });
                if (icon) gsap.to(icon, { rotation: 180, duration: 0.4, ease: "power3.out" });
            }
        });
    });
}

/* ==========================================
   ANIMATIONS D'APPARITION AU SCROLL OPTIMISÉES
   ========================================== */
function initScrollAnimations() {
    // Configuration par défaut pour alléger l'exécution
    const scrollDefaults = {
        start: "top 85%",
        toggleActions: "play none none none",
        invalidateOnRefresh: true // Évite les bugs de positionnement si la page charge des images après
    };

    // 1. Présentation
    if (document.querySelector("#Presentation")) {
        gsap.from("#Presentation .section-title-block, #Presentation .text-rich p", {
            scrollTrigger: { trigger: "#Presentation", ...scrollDefaults },
            y: 30, opacity: 0, duration: 0.8, stagger: 0.15, ease: "power2.out"
        });
    }

    // 2. Organisation
    if (document.querySelector("#Organisation")) {
        gsap.from("#Organisation .section-header-center, .org-text", {
            scrollTrigger: { trigger: "#Organisation", ...scrollDefaults },
            y: 30, opacity: 0, duration: 0.7, stagger: 0.15
        });
        gsap.from(".slice-item", {
            scrollTrigger: { trigger: ".slice-list", ...scrollDefaults },
            scale: 0.95, opacity: 0, duration: 0.5, stagger: 0.1, ease: "back.out(1.2)"
        });
    }

    // 3. Formats
    if (document.querySelector(".accordion-container")) {
        gsap.from(".accordion-item", {
            scrollTrigger: { trigger: ".accordion-container", ...scrollDefaults },
            y: 30, opacity: 0, duration: 0.6, stagger: 0.1, ease: "power2.out"
        });
    }

    // 4. Événements (on anime le bloc carrousel, pas les cartes :
    //    celles-ci sont remplacées dynamiquement par l'API)
    if (document.querySelector("#Evenements .carousel")) {
        gsap.from("#Evenements .carousel", {
            scrollTrigger: { trigger: "#Evenements .carousel", ...scrollDefaults },
            y: 40, opacity: 0, duration: 0.8, ease: "power3.out"
        });
    }

    // 5. Formations
    if (document.querySelector("#Formations")) {
        gsap.from("#Formations h2, #Formations p, #Formations .btn", {
            scrollTrigger: { trigger: "#Formations", ...scrollDefaults },
            x: -30, opacity: 0, duration: 0.7, stagger: 0.15
        });
        gsap.from(".feature-list li", {
            scrollTrigger: { trigger: ".feature-list", ...scrollDefaults },
            x: 30, opacity: 0, duration: 0.5, stagger: 0.1, ease: "power2.out"
        });
    }

    // 6. Partenaires
    if (document.querySelector(".partner-tags")) {
        gsap.from(".partner-tags .tag", {
            scrollTrigger: { trigger: ".partner-tags", ...scrollDefaults },
            scale: 0.85, opacity: 0, duration: 0.4, stagger: 0.05, ease: "back.out(1.1)"
        });
    }

    // 7. Nouvelle section YouTube Vidéos / Actualités intégrée
    if (document.querySelector("#Actualites")) {
        gsap.from(".video-card, .news-card", {
            scrollTrigger: { trigger: "#Actualites", ...scrollDefaults },
            y: 40, opacity: 0, duration: 0.7, stagger: 0.15, ease: "power3.out"
        });
    }

    // 8. Newsletter
    if (document.querySelector("#Newsletter")) {
        gsap.from(".newsletter-box", {
            scrollTrigger: { trigger: "#Newsletter", ...scrollDefaults },
            y: 40, opacity: 0, duration: 0.8, ease: "power3.out"
        });
    }
}
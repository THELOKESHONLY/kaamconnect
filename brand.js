
window.RAPIDE_BRAND = {
  oldName: "KaamConnect",
  name: "RapideService",
  shortName: "RS",
  domain: "rapideservice.com",
  supportEmail: "support@rapideservice.com",
  otpEmail: "otp@rapideservice.com",
  phone: "+91 7303041394",
  tagline: "Hire trusted workers, freelancers and local helpers near you.",
  appSubtitle: "Hire Trusted Workers"
};

(function () {
  const BRAND = window.RAPIDE_BRAND;

  const replacements = [
    [/KC KaamConnect/g, "RS RapideService"],
    [/KaamConnect/g, BRAND.name],
    [/Kaamconnect/g, BRAND.name],
    [/KAAMCONNECT/g, "RAPIDESERVICE"],
    [/kaamconnect-one\.vercel\.app/g, BRAND.domain],
    [/kaamconnect\.com/g, BRAND.domain],
    [/kaamconnect\.in/g, BRAND.domain],
    [/kaamconnect\.app/g, BRAND.domain],
    [/support@kaamconnect\.com/g, BRAND.supportEmail],
    [/support@kaamconnect\.in/g, BRAND.supportEmail],
    [/support@kaamconnect\.app/g, BRAND.supportEmail],
    [/otp@kaamconnect\.com/g, BRAND.otpEmail],
    [/otp@kaamconnect\.in/g, BRAND.otpEmail],
    [/otp@kaamconnect\.app/g, BRAND.otpEmail]
  ];

  function replaceText(value) {
    if (!value || typeof value !== "string") return value;

    let output = value;

    replacements.forEach(([search, replace]) => {
      output = output.replace(search, replace);
    });

    return output;
  }

  function shouldSkipNode(node) {
    if (!node || !node.parentElement) return false;

    const tag = node.parentElement.tagName;

    return ["SCRIPT", "STYLE", "CODE", "PRE", "TEXTAREA"].includes(tag);
  }

  function updateTextNode(node) {
    if (!node || shouldSkipNode(node)) return;

    const oldValue = node.nodeValue;
    const newValue = replaceText(oldValue);

    if (oldValue !== newValue) {
      node.nodeValue = newValue;
    }
  }

  function updateAttributes(element) {
    if (!element || !element.attributes) return;

    const attrs = [
      "title",
      "alt",
      "placeholder",
      "aria-label",
      "content",
      "value"
    ];

    attrs.forEach((attr) => {
      if (element.hasAttribute(attr)) {
        const oldValue = element.getAttribute(attr);
        const newValue = replaceText(oldValue);

        if (oldValue !== newValue) {
          element.setAttribute(attr, newValue);
        }
      }
    });
  }

  function walk(root) {
    if (!root) return;

    if (root.nodeType === Node.TEXT_NODE) {
      updateTextNode(root);
      return;
    }

    if (root.nodeType === Node.ELEMENT_NODE) {
      updateAttributes(root);
    }

    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      null
    );

    let node;

    while ((node = walker.nextNode())) {
      if (node.nodeType === Node.TEXT_NODE) {
        updateTextNode(node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        updateAttributes(node);
      }
    }
  }

  function applyBrand() {
    document.title = `${BRAND.name} - Hire Trusted Workers`;

    const description = document.querySelector('meta[name="description"]');

    if (description) {
      description.setAttribute("content", BRAND.tagline);
    }

    if (document.body) {
      walk(document.body);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyBrand();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => walk(node));

        if (mutation.type === "characterData") {
          updateTextNode(mutation.target);
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    window.applyRapideServiceBrand = applyBrand;
  });
})();

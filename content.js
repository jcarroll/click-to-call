(function() {
  'use strict';

  const phonePatterns = [
    /\b\+?1?[-.]?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})\b/g,
    /\b\+?([0-9]{1,3})[-.\s]?\(?([0-9]{2,4})\)?[-.\s]?([0-9]{3,4})[-.\s]?([0-9]{3,4})\b/g,
    /\b([0-9]{3})[-.]([0-9]{3})[-.]([0-9]{4})\b/g,
    /\b\(([0-9]{3})\)\s?([0-9]{3})[-.]([0-9]{4})\b/g
  ];

  const telifiedClass = 'telified-link';
  const processedAttr = 'data-telified';

  function cleanPhoneNumber(phone) {
    return phone.replace(/[^0-9+]/g, '');
  }

  function isValidNode(node) {
    if (node.nodeType !== Node.TEXT_NODE) return false;
    if (!node.parentNode) return false;
    
    const tagName = node.parentNode.tagName;
    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'A'].includes(tagName)) return false;
    if (node.parentNode.hasAttribute(processedAttr)) return false;
    
    return true;
  }

  function telifyNode(node) {
    if (!isValidNode(node)) return;

    let text = node.textContent;
    let hasMatch = false;

    phonePatterns.forEach(pattern => {
      if (pattern.test(text)) {
        hasMatch = true;
      }
    });

    if (!hasMatch) return;

    var fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let modified = false;

    phonePatterns.forEach(pattern => {
      var matches = [...text.matchAll(pattern)];
      
      matches.forEach(match => {
        if (match.index >= lastIndex) {
          if (match.index > lastIndex) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
          }

          var phoneNumber = match[0];
          var cleanNumber = cleanPhoneNumber(phoneNumber);
          
          var link = document.createElement('a');
          link.href = 'tel:' + cleanNumber;
          link.textContent = phoneNumber;
          link.className = telifiedClass;
          link.style.cssText = 'color: inherit; text-decoration: underline; cursor: pointer;';
          
          fragment.appendChild(link);
          lastIndex = match.index + phoneNumber.length;
          modified = true;
        }
      });
    });

    if (modified) {
      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      }
      
      node.parentNode.replaceChild(fragment, node);
      node.parentNode.setAttribute(processedAttr, 'true');
    }
  }

  function telifyPage() {
    chrome.storage.sync.get(['enabled'], function(result) {
      if (result.enabled === false) return;

      var walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function(node) {
            return isValidNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
          }
        }
      );

      var nodes = [];
      let node;
      while (node = walker.nextNode()) {
        nodes.push(node);
      }

      nodes.forEach(telifyNode);
    });
  }

  var observer = new MutationObserver(function(mutations) {
    chrome.storage.sync.get(['enabled'], function(result) {
      if (result.enabled === false) return;

      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === Node.TEXT_NODE) {
            telifyNode(node);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            var walker = document.createTreeWalker(
              node,
              NodeFilter.SHOW_TEXT,
              { acceptNode: node => isValidNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT }
            );
            var textNodes = [];
            let textNode;
            while (textNode = walker.nextNode()) {
              textNodes.push(textNode);
            }
            textNodes.forEach(telifyNode);
          }
        });
      });
    });
  });

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'convertNow') {
      telifyPage();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', telifyPage);
  } else {
    telifyPage();
  }

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();
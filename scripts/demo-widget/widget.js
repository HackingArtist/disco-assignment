/* Disco offer widget behaviour for the bundled Harvest Table demo.
   The page renders through the x-dc runtime, so this listens on `document`
   rather than binding to nodes that may not exist yet at script time. */
(function () {
  var OFFERS = {
    morrow: { partnerName: '45 degrees', couponCode: 'MORROW20', destinationLabel: 'Shop Morrow' },
    'field-notes': { partnerName: 'Field Notes', couponCode: 'TRAILSET', destinationLabel: 'Shop Field Notes' },
    ritual: { partnerName: 'Ritual Goods', couponCode: 'RITUAL25', destinationLabel: 'Shop Ritual Goods' }
  };

  function setField(root, name, value) {
    var node = root.querySelector('[data-ow-field="' + name + '"]');
    if (node) node.textContent = value;
  }

  function moveTo(root, state) {
    setField(root, 'copyLabel', 'Copy');
    root.setAttribute('data-ow-state', state);
  }

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || typeof target.closest !== 'function') return;

    var trigger = target.closest('[data-ow-action]');
    if (!trigger) return;
    var root = trigger.closest('[data-ow-widget]');
    if (!root) return;

    var action = trigger.getAttribute('data-ow-action');

    if (action === 'claim') {
      var offer = OFFERS[trigger.getAttribute('data-ow-offer')] || OFFERS.morrow;
      setField(root, 'partnerName', offer.partnerName);
      setField(root, 'couponCode', offer.couponCode);
      setField(root, 'destinationLabel', offer.destinationLabel);
      var coupon = root.querySelector('[data-ow-action="copy"]');
      if (coupon) coupon.setAttribute('aria-label', 'Copy offer code ' + offer.couponCode);
      moveTo(root, 'claimed');
      return;
    }

    if (action === 'reject') {
      moveTo(root, 'recovery');
      return;
    }

    if (action === 'dismiss') {
      moveTo(root, 'exit');
      return;
    }

    if (action === 'undo') {
      moveTo(root, 'default');
      return;
    }

    if (action === 'copy') {
      var code = root.querySelector('[data-ow-field="couponCode"]');
      var text = code ? code.textContent : '';
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text);
      } catch (err) {
        /* Clipboard access can be unavailable inside embedded previews. */
      }
      setField(root, 'copyLabel', 'Copied');
    }
  });
})();

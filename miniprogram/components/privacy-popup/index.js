const privacy = require('../../utils/privacy.js');
const font = require('../../utils/font.js');

Component({
  options: { styleIsolation: 'apply-shared' },
  data: {
    visible: false,
    contractName: privacy.DEFAULT_CONTRACT,
    fontClass: 'm'
  },
  pageLifetimes: {
    show() {
      font.apply(this);
      privacy.activate(this);
    }
  },
  lifetimes: {
    detached() { privacy.detach(this); }
  },
  methods: {
    onAgree() { privacy.settle(this, true); },
    onDecline() { privacy.settle(this, false); },
    onOpenContract() { privacy.openContract(); },
    noop() {}
  }
});

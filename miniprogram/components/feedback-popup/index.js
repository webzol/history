const feedback = require('../../utils/feedback.js');

Component({
  options: { styleIsolation: 'apply-shared' },
  data: { notice: feedback.EMPTY, fontClass: 'm' },
  pageLifetimes: {
    show() { feedback.activate(this); },
    hide() { feedback.deactivate(this); }
  },
  lifetimes: {
    detached() { feedback.deactivate(this, true); }
  },
  methods: {
    onCancel() { feedback.dismiss(this, false); },
    onConfirm() { feedback.dismiss(this, true); },
    noop() {}
  }
});

Component({ properties: { text: String, type: { type: String, value: "primary" }, disabled: Boolean }, methods: { onTap() { if (!this.data.disabled) this.triggerEvent("tap"); } } });

Component({ properties: { points: { type: Array, value: [] } }, methods: { tapPoint(e) { const item = e.currentTarget.dataset.item; this.triggerEvent("point", item); } } });

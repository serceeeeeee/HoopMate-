Component({ properties: { item: Object }, methods: { open() { this.triggerEvent("open", { id: this.data.item && this.data.item.id, url: this.data.item && this.data.item.url }); } } });

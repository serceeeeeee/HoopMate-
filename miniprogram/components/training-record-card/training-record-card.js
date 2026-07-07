Component({
  properties: { record: Object },
  methods: {
    openDetail() { this.triggerEvent("detail", { id: this.data.record && this.data.record.id }); },
    remove() { this.triggerEvent("delete", { id: this.data.record && this.data.record.id }); }
  }
});

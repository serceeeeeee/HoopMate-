Component({ properties: { title: { type: String, value: "暂无数据" }, desc: String, buttonText: String }, methods: { onTap() { this.triggerEvent("action"); } } });

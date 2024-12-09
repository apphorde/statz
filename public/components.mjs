import { html, createComponent, defineProps, defineEvents } from "@lithium/web";
import "@lucide/lucide-icon";

createComponent("st-panel", {
  setup() {
    defineProps(["icon", "title"]);
    const emit = defineEvents(["refresh"]);

    return {
      onRefresh() {
        emit("refresh");
      },
    };
  },
  // shadowDom: { mode: "open" },
  template:
    html(`<div class="bg-white/10 p-6 rounded-lg shadow-md text-gray-200">
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-sm font-medium">{{ title }}</h2>
        <button on-click="onRefresh()">
          <lucide-icon bind-icon="icon"></lucide-icon>
        </button>
      <slot></slot>
    </div>`),
});

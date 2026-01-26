import { createApp } from "vue";
import TDesign from "tdesign-vue-next";
import App from "./App";
import router from "./router";
import "./style.less";

import "tdesign-vue-next/es/style/index.css";
import "tdesign-vue-next/dist/reset.css";

import "./lib.css";
import "./lib.less";

const app = createApp(App);

app.use(router);
app.use(TDesign);
app.mount("#app");

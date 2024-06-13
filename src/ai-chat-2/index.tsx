import * as React from "react";
import * as ReactDOM from "react-dom";
import App from "./App";
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { Title } from "@mantine/core";

ReactDOM.render(
  <React.StrictMode>
    <MantineProvider>
      <Title>Header</Title>
      <App />
    </MantineProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

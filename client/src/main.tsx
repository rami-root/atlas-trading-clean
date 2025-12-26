import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

// تعطيل redirectToLoginIfUnauthorized لأننا نستخدم AuthContext الآن
// const redirectToLoginIfUnauthorized = (error: unknown) => {
//   if (!(error instanceof TRPCClientError)) return;
//   if (typeof window === "undefined") return;

//   const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

//   if (!isUnauthorized) return;

//   window.location.href = getLoginUrl();
// };

// queryClient.getQueryCache().subscribe(event => {
//   if (event.type === "updated" && event.action.type === "error") {
//     const error = event.query.state.error;
//     redirectToLoginIfUnauthorized(error);
//     console.error("[API Query Error]", error);
//   }
// });

// queryClient.getMutationCache().subscribe(event => {
//   if (event.type === "updated" && event.action.type === "error") {
//     const error = event.mutation.state.error;
//     redirectToLoginIfUnauthorized(error);
//     console.error("[API Mutation Error]", error);
//   }
// });

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);

import { analyticsRouter } from "./routers/analytics";
import { formRouter } from "./routers/form";
import { submissionRouter } from "./routers/submission";
import { viewRouter } from "./routers/view";
import { router } from "./trpc";

export const appRouter = router({
  form: formRouter,
  submission: submissionRouter,
  view: viewRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
